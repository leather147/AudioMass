import type { PcmAudio, WaveformPeaks } from './types.js';

export interface PeakWorkerRequest {
  audio: PcmAudio;
  requestId: number;
  width: number;
}

export type PeakWorkerResponse =
  | { peaks: WaveformPeaks; requestId: number; type: 'success' }
  | { message: string; requestId: number; type: 'error' };
