/// <reference lib="webworker" />

import { analyzeFrequency } from '../analysis/frequency.js';
import type {
  FrequencyAnalysisRequest,
  FrequencyAnalysisResponse,
} from './frequency-analysis-protocol.js';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener('message', (event: MessageEvent<FrequencyAnalysisRequest>) => {
  const request = event.data;
  try {
    const analysis = analyzeFrequency(request.audio, request.options);
    const response: FrequencyAnalysisResponse = {
      analysis,
      id: request.id,
      type: 'frequency-analyzed',
    };
    workerScope.postMessage(response, [
      analysis.spectrum.frequencies.buffer,
      analysis.spectrum.magnitudesDb.buffer,
      analysis.spectrogram.magnitudesDb.buffer,
      analysis.spectrogram.times.buffer,
    ]);
  } catch (error) {
    const response: FrequencyAnalysisResponse = {
      error: error instanceof Error ? error.message : 'Frequency analysis failed.',
      id: request.id,
      type: 'error',
    };
    workerScope.postMessage(response);
  }
});

export {};
