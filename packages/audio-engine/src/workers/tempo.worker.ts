import { analyzeTempo, type AudioBufferView } from '../analysis/tempo.js';
import type { TempoAnalyzeRequest, TempoAnalyzeResponse } from './tempo-worker-protocol.js';

const worker = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<TempoAnalyzeRequest>) => void) | null;
  postMessage(message: TempoAnalyzeResponse): void;
};

worker.onmessage = (event: MessageEvent<TempoAnalyzeRequest>) => {
  const request = event.data;
  try {
    const channels = request.channels.map((channel: ArrayBuffer) => new Float32Array(channel));
    const length = channels[0]?.length ?? 0;
    if (!channels.length || channels.some((channel) => channel.length !== length)) {
      throw new TypeError('Tempo worker received inconsistent PCM channels.');
    }
    const audio: AudioBufferView = {
      duration: length / request.sampleRate,
      getChannelData: (channel) => {
        const data = channels[channel];
        if (!data) throw new RangeError(`PCM channel ${channel} does not exist.`);
        return data;
      },
      length,
      numberOfChannels: channels.length,
      sampleRate: request.sampleRate,
    };
    worker.postMessage({
      id: request.id,
      result: analyzeTempo(audio, request.options),
      type: 'analyzed',
    });
  } catch (error) {
    worker.postMessage({
      error: error instanceof Error ? error.message : 'Tempo analysis failed.',
      id: request.id,
      type: 'error',
    });
  }
};

export {};
