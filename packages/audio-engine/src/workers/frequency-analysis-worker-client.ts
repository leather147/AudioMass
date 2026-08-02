import type { FrequencyAnalysis, FrequencyAnalysisOptions } from '../analysis/frequency.js';
import { AudioEngineError } from '../errors.js';
import type { PcmAudio } from '../types.js';
import type {
  FrequencyAnalysisRequest,
  FrequencyAnalysisResponse,
} from './frequency-analysis-protocol.js';

interface PendingAnalysis {
  reject: (error: Error) => void;
  resolve: (analysis: FrequencyAnalysis) => void;
}

export class FrequencyAnalysisWorkerClient {
  private nextId = 0;
  private readonly pending = new Map<number, PendingAnalysis>();
  private readonly worker: Worker;

  public constructor(
    workerFactory: () => Worker = () =>
      new Worker(new URL('./frequency-analysis.worker.js', import.meta.url), { type: 'module' }),
  ) {
    this.worker = workerFactory();
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);
  }

  public analyze(audio: PcmAudio, options?: FrequencyAnalysisOptions): Promise<FrequencyAnalysis> {
    const id = ++this.nextId;
    const channels = audio.channels.map((channel) => channel.slice());
    const request: FrequencyAnalysisRequest = {
      audio: { channels, sampleRate: audio.sampleRate },
      id,
      options,
      type: 'analyze-frequency',
    };
    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
      this.worker.postMessage(
        request,
        channels.map((channel) => channel.buffer),
      );
    });
  }

  public destroy(): void {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleError);
    this.worker.terminate();
    const error = new AudioEngineError(
      'ENGINE_CLOSED',
      'Frequency analysis worker was terminated.',
    );
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  }

  private readonly handleMessage = (event: MessageEvent<FrequencyAnalysisResponse>): void => {
    const response = event.data;
    const request = this.pending.get(response.id);
    if (!request) return;
    this.pending.delete(response.id);
    if (response.type === 'frequency-analyzed') request.resolve(response.analysis);
    else request.reject(new AudioEngineError('INVALID_AUDIO_DATA', response.error));
  };

  private readonly handleError = (event: ErrorEvent): void => {
    const error = new AudioEngineError(
      'INVALID_AUDIO_DATA',
      event.message || 'Frequency analysis failed.',
      { cause: event.error },
    );
    for (const request of this.pending.values()) request.reject(error);
    this.pending.clear();
  };
}
