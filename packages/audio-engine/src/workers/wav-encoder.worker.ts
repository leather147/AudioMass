import { encodePcmAsWav } from '../codecs/wav.js';
import type { WavEncodeRequest, WavEncodeResponse } from './wav-encoder-protocol.js';

const worker = globalThis as typeof globalThis & {
  onmessage: ((event: MessageEvent<WavEncodeRequest>) => void) | null;
  postMessage(message: WavEncodeResponse, transfer?: Transferable[]): void;
};

worker.onmessage = (event) => {
  const request = event.data;
  try {
    const wav = encodePcmAsWav(
      {
        channels: request.channels.map((channel: ArrayBuffer) => new Float32Array(channel)),
        sampleRate: request.sampleRate,
      },
      request.bitDepth,
    );
    worker.postMessage({ id: request.id, type: 'encoded', wav }, [wav]);
  } catch (error) {
    worker.postMessage({
      error: error instanceof Error ? error.message : 'WAV encoding failed.',
      id: request.id,
      type: 'error',
    });
  }
};

export {};
