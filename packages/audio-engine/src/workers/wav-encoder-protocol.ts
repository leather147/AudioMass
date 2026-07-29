import type { WavBitDepth } from '../codecs/wav.js';

export interface WavEncodeRequest {
  bitDepth: WavBitDepth;
  channels: ArrayBuffer[];
  id: string;
  sampleRate: number;
  type: 'encode';
}

export type WavEncodeResponse =
  { id: string; type: 'encoded'; wav: ArrayBuffer } | { error: string; id: string; type: 'error' };
