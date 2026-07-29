import type { TempoOptions, TempoResult } from '../analysis/tempo.js';
import { AudioEngineError } from '../errors.js';
import type { PcmAudio } from '../types.js';
import type { TempoAnalyzeRequest, TempoAnalyzeResponse } from './tempo-worker-protocol.js';

interface PendingTempoRequest {
  reject(error: Error): void;
  resolve(result: TempoResult): void;
}

export class TempoWorkerClient {
  private nextRequestId = 0;
  private readonly pending = new Map<string, PendingTempoRequest>();
  private readonly worker: Worker;

  public constructor(
    workerFactory: () => Worker = () =>
      new Worker(new URL('./tempo.worker.js', import.meta.url), { type: 'module' }),
  ) {
    this.worker = workerFactory();
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);
  }

  public analyze(audio: PcmAudio, options?: TempoOptions): Promise<TempoResult> {
    const id = `tempo-${++this.nextRequestId}`;
    const channels = audio.channels.map((channel) => channel.slice().buffer);
    const request: TempoAnalyzeRequest = {
      channels,
      id,
      options,
      sampleRate: audio.sampleRate,
      type: 'analyze',
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
      this.worker.postMessage(request, channels);
    });
  }

  public destroy(): void {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleError);
    this.worker.terminate();
    this.rejectAll(new AudioEngineError('ENGINE_CLOSED', 'Tempo worker was terminated.'));
  }

  private readonly handleMessage = (event: MessageEvent<TempoAnalyzeResponse>): void => {
    const response = event.data;
    const pending = this.pending.get(response.id);
    if (!pending) return;
    this.pending.delete(response.id);
    if (response.type === 'analyzed') pending.resolve(response.result);
    else pending.reject(new AudioEngineError('INVALID_AUDIO_DATA', response.error));
  };

  private readonly handleError = (event: ErrorEvent): void => {
    this.rejectAll(
      new AudioEngineError('INVALID_AUDIO_DATA', event.message || 'Tempo analysis failed.', {
        cause: event.error,
      }),
    );
  };

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
