import { describe, expect, it } from 'vitest';

import { analyzeLoudness, gainForLoudnessTarget, type AudioBufferView } from '../src/index.js';

function buffer(samples: Float32Array, sampleRate = 48_000): AudioBufferView {
  return {
    duration: samples.length / sampleRate,
    getChannelData: () => samples,
    length: samples.length,
    numberOfChannels: 1,
    sampleRate,
  };
}

describe('BS.1770 loudness analysis', () => {
  it('preserves deterministic silence, peak, and RMS contracts', () => {
    expect(analyzeLoudness(buffer(new Float32Array(48_000)))).toMatchObject({
      blocks: 7,
      lufs: Number.NEGATIVE_INFINITY,
      peak: 0,
      peakDb: -120,
      rms: 0,
      rmsDb: -120,
    });
    const sine = Float32Array.from({ length: 48_000 }, (_, index) =>
      Math.sin((2 * Math.PI * 1_000 * index) / 48_000),
    );
    const report = analyzeLoudness(buffer(sine));
    expect(report.peak).toBeCloseTo(1, 5);
    expect(report.rms).toBeCloseTo(Math.SQRT1_2, 4);
  });

  it('limits normalization by the true-peak ceiling', () => {
    const result = gainForLoudnessTarget(
      {
        blocks: 1,
        lufs: -20,
        peak: 0.5,
        peakDb: -6,
        rms: 0.25,
        rmsDb: -12,
        truePeak: 0.5,
        truePeakDb: -6,
      },
      -14,
      -1,
    );
    expect(result).toMatchObject({ gainDb: 5, limited: true });
  });
});
