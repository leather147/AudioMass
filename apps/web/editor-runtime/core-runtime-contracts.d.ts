type AMRuntimeEventListener = (value?: unknown, value2?: unknown) => void;

interface AMRuntimeStateSnapshot {
  data: unknown;
  desc?: string;
  id?: number;
  markers?: unknown;
  mt?: unknown;
  type?: 'mult' | 'mrk' | string;
  ctx?: unknown;
}

interface AMRuntimeStateManager {
  clearAllState(): void;
  getLastUndoState(): AMRuntimeStateSnapshot | undefined;
  popUndoState(): AMRuntimeStateSnapshot | undefined;
  pushUndoState(state: AMRuntimeStateSnapshot): boolean;
  shiftRedoState(): AMRuntimeStateSnapshot | undefined;
}

interface AMRuntimeKeyCallback {
  callback(keyCode: number, keyMap: Record<number, boolean>, event: KeyboardEvent): void;
  keys: number[];
}

interface AMRuntimeSingleKeyCallback {
  callback(event: KeyboardEvent): void;
  key: number;
}

interface AMRuntimeKeyHandlerFull extends AMRuntimeKeyHandler {
  callbacks: Record<string, AMRuntimeKeyCallback | null>;
  keyMap: Record<number, boolean>;
  mac: boolean;
  singleCallbacks: Record<string, AMRuntimeSingleKeyCallback | null>;
  addCallback(name: string, callback: AMRuntimeKeyCallback['callback'], keys: number[]): void;
  addSingleCallback(
    name: string,
    callback: AMRuntimeSingleKeyCallback['callback'],
    key: number,
  ): void;
  isAccel(event?: KeyboardEvent): boolean;
  isEditTarget(event?: Event): boolean;
  keyDown(keyCode: number, event: KeyboardEvent): void;
  keyPress(keyCode: number, event: KeyboardEvent): void;
  keyUp(keyCode: number): void;
  removeCallback(name: string): void;
}

interface AMRuntimeCaptureOptions {
  chunkSize?: number;
  ctx: AudioContext;
  ondata?(samples: Float32Array): void;
  onerror?(error: Error | null): void;
  onstart?(): void;
}

interface AMRuntimeRecorder {
  isActive(): boolean;
  setEndingOffset(seconds: number): void;
  start(
    offset: number,
    onEnd: (offset: number | null, buffers: Float32Array[] | null) => void,
    onStart?: () => void,
    sampleRate?: number,
  ): boolean;
  startCapture(options: AMRuntimeCaptureOptions): boolean;
  stop(cancel?: boolean): void;
  stopCapture(done?: () => void): void;
}

interface AMRuntimeWorkletPort {
  onmessage: ((event: MessageEvent<Float32Array | 0>) => void) | null;
  postMessage(value: Float32Array | 0, transfer?: Transferable[]): void;
}

declare abstract class AudioWorkletProcessor {
  readonly port: AMRuntimeWorkletPort;
  constructor(options?: unknown);
  abstract process(inputs: Float32Array[][]): boolean;
}

declare function registerProcessor(
  name: string,
  processor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor,
): void;
