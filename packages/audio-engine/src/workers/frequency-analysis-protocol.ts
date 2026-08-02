import type { FrequencyAnalysis, FrequencyAnalysisOptions } from '../analysis/frequency.js';
import type { PcmAudio } from '../types.js';

export interface FrequencyAnalysisRequest {
  audio: PcmAudio;
  id: number;
  options?: FrequencyAnalysisOptions;
  type: 'analyze-frequency';
}

export type FrequencyAnalysisResponse =
  | { analysis: FrequencyAnalysis; id: number; type: 'frequency-analyzed' }
  | { error: string; id: number; type: 'error' };
