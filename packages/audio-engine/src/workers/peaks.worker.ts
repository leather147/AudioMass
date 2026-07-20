/// <reference lib="webworker" />

import { extractWaveformPeaks } from '../dsp/peaks.js';
import type { PeakWorkerRequest, PeakWorkerResponse } from '../peak-worker-protocol.js';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener('message', (event: MessageEvent<PeakWorkerRequest>) => {
  const { audio, requestId, width } = event.data;
  try {
    const peaks = extractWaveformPeaks(audio, width);
    const response: PeakWorkerResponse = { peaks, requestId, type: 'success' };
    workerScope.postMessage(response, [peaks.min.buffer, peaks.max.buffer]);
  } catch (error) {
    const response: PeakWorkerResponse = {
      message: error instanceof Error ? error.message : 'Waveform peak extraction failed.',
      requestId,
      type: 'error',
    };
    workerScope.postMessage(response);
  }
});

export {};
