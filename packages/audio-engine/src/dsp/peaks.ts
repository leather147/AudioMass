import { AudioEngineError } from '../errors.js';
import type { PcmAudio, WaveformAnalysis, WaveformPeaks } from '../types.js';

import { assertValidPcm } from './pcm.js';

function assertValidWidth(width: number): void {
  if (!Number.isInteger(width) || width <= 0) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'Waveform width must be a positive integer.');
  }
}

function extractPeaks(channels: readonly Float32Array[], width: number): WaveformPeaks {
  const length = channels[0]?.length ?? 0;
  const samplesPerPixel = Math.max(1, Math.ceil(length / width));
  const peakCount = Math.max(1, Math.ceil(length / samplesPerPixel));
  const min = new Float32Array(peakCount);
  const max = new Float32Array(peakCount);

  for (let pixel = 0; pixel < peakCount; pixel += 1) {
    const start = pixel * samplesPerPixel;
    const end = Math.min(length, start + samplesPerPixel);
    let minimum = 1;
    let maximum = -1;
    for (const channel of channels) {
      for (let frame = start; frame < end; frame += 1) {
        const sample = channel[frame] ?? 0;
        minimum = Math.min(minimum, sample);
        maximum = Math.max(maximum, sample);
      }
    }
    min[pixel] = end === start ? 0 : minimum;
    max[pixel] = end === start ? 0 : maximum;
  }

  return { length, max, min, samplesPerPixel };
}

export function extractWaveformPeaks(audio: PcmAudio, width: number): WaveformPeaks {
  assertValidPcm(audio);
  assertValidWidth(width);
  return extractPeaks(audio.channels, width);
}

export function extractWaveformAnalysis(audio: PcmAudio, width: number): WaveformAnalysis {
  assertValidPcm(audio);
  assertValidWidth(width);
  return {
    channels: audio.channels.map((channel) => extractPeaks([channel], width)),
    overview: extractPeaks(audio.channels, width),
  };
}
