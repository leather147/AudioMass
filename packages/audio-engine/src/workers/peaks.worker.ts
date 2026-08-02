/// <reference lib="webworker" />

import { extractWaveformAnalysis, extractWaveformPeaks } from '../dsp/peaks.js';
import type { PeakWorkerRequest, PeakWorkerResponse } from '../peak-worker-protocol.js';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener('message', (event: MessageEvent<PeakWorkerRequest>) => {
  const { audio, requestId, type, width } = event.data;
  try {
    if (type === 'analysis') {
      const analysis = extractWaveformAnalysis(audio, width);
      const response: PeakWorkerResponse = { analysis, requestId, type: 'analysis' };
      workerScope.postMessage(response, [
        analysis.overview.min.buffer,
        analysis.overview.max.buffer,
        ...analysis.channels.flatMap((channel) => [channel.min.buffer, channel.max.buffer]),
      ]);
      return;
    }
    const peaks = extractWaveformPeaks(audio, width);
    const response: PeakWorkerResponse = { peaks, requestId, type: 'peaks' };
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
