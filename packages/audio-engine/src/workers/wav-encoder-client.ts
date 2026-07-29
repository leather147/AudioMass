import type { WavBitDepth } from '../codecs/wav.js';
import { AudioEngineError } from '../errors.js';
import type { PcmAudio } from '../types.js';
import type { WavEncodeRequest, WavEncodeResponse } from './wav-encoder-protocol.js';

interface PendingWavRequest {
  reject(error: Error): void;
  resolve(wav: ArrayBuffer): void;
}

export class WavEncoderWorkerClient {
  private nextRequestId = 0;
  private readonly pending = new Map<string, PendingWavRequest>();
  private readonly worker: Worker;

  public constructor(
    workerFactory: () => Worker = () =>
      new Worker(new URL('./wav-encoder.worker.js', import.meta.url), { type: 'module' }),
  ) {
    this.worker = workerFactory();
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);
  }

  public encode(audio: PcmAudio, bitDepth: WavBitDepth = 16): Promise<ArrayBuffer> {
    const id = `wav-${++this.nextRequestId}`;
    const channels = audio.channels.map((channel) => channel.slice().buffer);
    const request: WavEncodeRequest = {
      bitDepth,
      channels,
      id,
      sampleRate: audio.sampleRate,
      type: 'encode',
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
    this.rejectAll(new AudioEngineError('ENGINE_CLOSED', 'WAV encoder worker was terminated.'));
  }

  private readonly handleMessage = (event: MessageEvent<WavEncodeResponse>): void => {
    const response = event.data;
    const pending = this.pending.get(response.id);
    if (!pending) return;
    this.pending.delete(response.id);
    if (response.type === 'encoded') pending.resolve(response.wav);
    else pending.reject(new AudioEngineError('INVALID_AUDIO_DATA', response.error));
  };

  private readonly handleError = (event: ErrorEvent): void => {
    this.rejectAll(
      new AudioEngineError('INVALID_AUDIO_DATA', event.message || 'WAV encoding failed.', {
        cause: event.error,
      }),
    );
  };

  private rejectAll(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
