import { PluginError } from './errors.js';
import type { Disposable } from './types.js';

export interface RpcTransport {
  addEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void;
  close?(): void;
  postMessage(message: unknown, transfer?: readonly Transferable[]): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void;
  start?(): void;
}

type RpcHandler = (payload: unknown) => unknown | Promise<unknown>;

interface RpcRequest {
  id: number;
  method: string;
  payload: unknown;
  type: 'request';
}

type RpcResponse =
  | { id: number; result: unknown; type: 'success' }
  | { error: { message: string; name: string }; id: number; type: 'error' };

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class RpcPeer implements Disposable {
  private closed = false;
  private readonly handlers = new Map<string, RpcHandler>();
  private nextId = 0;
  private readonly pending = new Map<number, PendingRequest>();

  constructor(
    private readonly transport: RpcTransport,
    private readonly timeoutMs = 15_000,
  ) {
    transport.addEventListener('message', this.handleMessage);
    transport.start?.();
  }

  expose(method: string, handler: RpcHandler): Disposable {
    if (this.handlers.has(method)) {
      throw new PluginError('CONTRIBUTION_CONFLICT', `RPC method ${method} is already exposed.`);
    }
    this.handlers.set(method, handler);
    return {
      dispose: () => {
        this.handlers.delete(method);
      },
    };
  }

  request<Result = unknown>(
    method: string,
    payload?: unknown,
    transfer: readonly Transferable[] = [],
  ): Promise<Result> {
    if (this.closed) return Promise.reject(new PluginError('RPC_CLOSED', 'RPC peer is closed.'));
    const id = ++this.nextId;
    const request: RpcRequest = { id, method, payload, type: 'request' };
    return new Promise<Result>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new PluginError('RPC_TIMEOUT', `RPC method ${method} timed out.`));
      }, this.timeoutMs);
      this.pending.set(id, {
        reject,
        resolve: (value) => resolve(value as Result),
        timeout,
      });
      this.transport.postMessage(request, transfer);
    });
  }

  dispose(): void {
    if (this.closed) return;
    this.closed = true;
    this.transport.removeEventListener('message', this.handleMessage);
    this.transport.close?.();
    const error = new PluginError('RPC_CLOSED', 'RPC peer is closed.');
    for (const request of this.pending.values()) {
      clearTimeout(request.timeout);
      request.reject(error);
    }
    this.pending.clear();
    this.handlers.clear();
  }

  private readonly handleMessage = (event: MessageEvent<unknown>): void => {
    const message = event.data;
    if (!message || typeof message !== 'object' || !('type' in message)) return;
    if ((message as RpcRequest).type === 'request') {
      void this.handleRequest(message as RpcRequest);
      return;
    }
    const response = message as RpcResponse;
    const pending = this.pending.get(response.id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    this.pending.delete(response.id);
    if (response.type === 'success') pending.resolve(response.result);
    else if (response.type === 'error') {
      const error = new Error(response.error.message);
      error.name = response.error.name;
      pending.reject(error);
    }
  };

  private async handleRequest(request: RpcRequest): Promise<void> {
    const handler = this.handlers.get(request.method);
    if (!handler) {
      this.sendError(request.id, new Error(`RPC method ${request.method} is not exposed.`));
      return;
    }
    try {
      const result = await handler(request.payload);
      const response: RpcResponse = { id: request.id, result, type: 'success' };
      this.transport.postMessage(response);
    } catch (error) {
      this.sendError(request.id, error instanceof Error ? error : new Error(String(error)));
    }
  }

  private sendError(id: number, error: Error): void {
    const response: RpcResponse = {
      error: { message: error.message, name: error.name },
      id,
      type: 'error',
    };
    this.transport.postMessage(response);
  }
}
