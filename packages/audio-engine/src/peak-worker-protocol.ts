import type { PcmAudio, WaveformAnalysis, WaveformPeaks } from './types.js';

export interface PeakWorkerRequest {
  audio: PcmAudio;
  requestId: number;
  type: 'analysis' | 'peaks';
  width: number;
}

export type PeakWorkerResponse =
  | { analysis: WaveformAnalysis; requestId: number; type: 'analysis' }
  | { peaks: WaveformPeaks; requestId: number; type: 'peaks' }
  | { message: string; requestId: number; type: 'error' };
