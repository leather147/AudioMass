import type { TempoOptions, TempoResult } from '../analysis/tempo.js';

export interface TempoAnalyzeRequest {
  channels: ArrayBuffer[];
  id: string;
  options?: TempoOptions;
  sampleRate: number;
  type: 'analyze';
}

export type TempoAnalyzeResponse =
  | { id: string; result: TempoResult; type: 'analyzed' }
  | { error: string; id: string; type: 'error' };
