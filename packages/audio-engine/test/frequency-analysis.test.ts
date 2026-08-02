import { describe, expect, it } from 'vitest';

import { analyzeFrequency } from '../src/index.js';

function sine(frequency: number, seconds = 1, sampleRate = 48_000) {
  return {
    channels: [
      Float32Array.from(
        { length: Math.round(seconds * sampleRate) },
        (_, index) => Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.5,
      ),
    ],
    sampleRate,
  };
}

describe('frequency and spectrogram analysis', () => {
  it('locates a stable sine peak and returns a finite frame-major spectrogram', () => {
    const result = analyzeFrequency(sine(1000), {
      fftSize: 2048,
      frameCount: 12,
      maxFrequency: 8000,
    });
    let peak = 0;
    for (let index = 1; index < result.spectrum.magnitudesDb.length; index += 1) {
      if (
        (result.spectrum.magnitudesDb[index] ?? -120) > (result.spectrum.magnitudesDb[peak] ?? -120)
      ) {
        peak = index;
      }
    }

    expect(Math.abs((result.spectrum.frequencies[peak] ?? 0) - 1000)).toBeLessThan(24);
    expect(result.spectrum.magnitudesDb[peak]).toBeGreaterThan(-12);
    expect(result.spectrogram.frameCount).toBe(12);
    expect(result.spectrogram.magnitudesDb).toHaveLength(
      12 * result.spectrogram.frequencies.length,
    );
    expect([...result.spectrogram.magnitudesDb].every(Number.isFinite)).toBe(true);
    expect(result.spectrogram.times[0]).toBeLessThan(result.spectrogram.times[11] ?? 0);
  });

  it('mixes channels, caps the Nyquist range, and rejects unbounded work', () => {
    const audio = sine(440, 0.1, 8000);
    const result = analyzeFrequency(
      {
        channels: [audio.channels[0]!, audio.channels[0]!.map((sample) => -sample)],
        sampleRate: 8000,
      },
      { fftSize: 256, frameCount: 2, maxFrequency: 20_000 },
    );

    expect(result.spectrum.frequencies.at(-1)).toBe(4000);
    expect(Math.max(...result.spectrum.magnitudesDb)).toBeLessThanOrEqual(-120);
    expect(() => analyzeFrequency(audio, { fftSize: 300 })).toThrow('power of two');
    expect(() => analyzeFrequency(audio, { frameCount: 257 })).toThrow('1..256');
  });
});
