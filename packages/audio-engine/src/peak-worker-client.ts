import { AudioEngineError } from './errors.js';
import type { PeakWorkerRequest, PeakWorkerResponse } from './peak-worker-protocol.js';
import type { PcmAudio, WaveformPeaks } from './types.js';

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (peaks: WaveformPeaks) => void;
}

export class PeakWorkerClient {
  private nextRequestId = 0;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly worker: Worker;

  constructor(
    workerFactory: () => Worker = () =>
      new Worker(new URL('./workers/peaks.worker.js', import.meta.url), { type: 'module' }),
  ) {
    this.worker = workerFactory();
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);
  }

  extract(audio: PcmAudio, width: number): Promise<WaveformPeaks> {
    const requestId = ++this.nextRequestId;
    const channels = audio.channels.map((channel) => channel.slice());
    const request: PeakWorkerRequest = {
      audio: { channels, sampleRate: audio.sampleRate },
      requestId,
      width,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { reject, resolve });
      this.worker.postMessage(
        request,
        channels.map((channel) => channel.buffer),
      );
    });
  }

  destroy(): void {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleError);
    this.worker.terminate();
    const error = new AudioEngineError('ENGINE_CLOSED', 'Peak worker was terminated.');
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  }

  private readonly handleMessage = (event: MessageEvent<PeakWorkerResponse>): void => {
    const response = event.data;
    const request = this.pending.get(response.requestId);
    if (!request) return;
    this.pending.delete(response.requestId);
    if (response.type === 'success') request.resolve(response.peaks);
    else request.reject(new AudioEngineError('INVALID_AUDIO_DATA', response.message));
  };

  private readonly handleError = (event: ErrorEvent): void => {
    const error = new AudioEngineError('INVALID_AUDIO_DATA', event.message, { cause: event.error });
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  };
}
