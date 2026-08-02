import { describe, expect, it } from 'vitest';

import { EffectProcessorRegistry } from '@audio-engine/effects/processing';
import type { PcmAudio } from '@audio-engine/types';

function mono(samples: readonly number[], sampleRate = 1000): PcmAudio {
  return { channels: [Float32Array.from(samples)], sampleRate };
}

function rms(samples: Float32Array, start = 0): number {
  let energy = 0;
  for (let index = start; index < samples.length; index += 1) {
    const sample = samples[index] ?? 0;
    energy += sample * sample;
  }
  return Math.sqrt(energy / Math.max(1, samples.length - start));
}

describe('fixed-duration primary effect processors', () => {
  const registry = new EffectProcessorRegistry();

  it('compresses linked channel peaks with knee, timing, ratio, and makeup contracts', () => {
    const source = mono(new Array<number>(16).fill(1));
    const output = registry.apply(source, 'compressor', {
      attack: 0,
      knee: 0,
      makeup: 0,
      ratio: 4,
      release: 0,
      threshold: -12,
    });

    expect(output.channels[0]?.[0]).toBeCloseTo(10 ** (-9 / 20), 5);
    expect(source.channels[0]?.[0]).toBe(1);
    expect(output.channels[0]).toHaveLength(source.channels[0]!.length);
  });

  it('smooths compressor attack and release instead of stepping gain', () => {
    const source = mono([...new Array<number>(100).fill(1), ...new Array<number>(100).fill(0.01)]);
    const output = registry.apply(source, 'compressor', {
      attack: 0.01,
      knee: 0,
      makeup: 0,
      ratio: 4,
      release: 0.02,
      threshold: -12,
    });

    expect(output.channels[0]?.[0]).toBeGreaterThan(output.channels[0]?.[99] ?? 1);
    expect(output.channels[0]?.[199]).toBeGreaterThan(output.channels[0]?.[100] ?? 1);
  });

  it('supports brickwall and legacy look-ahead limiter shaping without overs', () => {
    const source = mono([0.2, 2, -2, 0.1]);
    const hard = registry.apply(source, 'hard-limiter', {
      hard: true,
      limit: 0.5,
      lookAheadMs: 4,
      ratio: 0,
    });
    const shaped = registry.apply(source, 'hard-limiter', {
      hard: false,
      limit: 0.5,
      lookAheadMs: 4,
      ratio: 1,
    });

    expect(Array.from(hard.channels[0] ?? [])).toEqual([
      expect.closeTo(0.2),
      0.5,
      -0.5,
      expect.closeTo(0.1),
    ]);
    expect(Array.from(shaped.channels[0] ?? [])).toEqual([0.5, 0.5, -0.5, 0.5]);
  });

  it('preserves the delay feedback path and compatibility dry/wet mapping', () => {
    const source = mono([1, 0, 0, 0, 0, 0, 0, 0], 10);
    const output = registry.apply(source, 'delay', {
      delaySeconds: 0.2,
      feedback: 0.5,
      mix: 0.5,
    });

    expect(output.channels[0]?.[0]).toBe(1);
    expect(output.channels[0]?.[2]).toBe(1);
    expect(output.channels[0]?.[4]).toBe(0.5);
    expect(output.channels[0]?.[6]).toBe(0.25);
    expect(output.channels[0]).toHaveLength(source.channels[0]!.length);
  });

  it('uses the characterized legacy waveshaper equation for distortion', () => {
    const source = mono([-1, -0.5, 0, 0.5, 1]);
    const output = registry.apply(source, 'distortion', { amount: 0.5 });
    const gain = 50;
    const expected = ((3 + gain) * 0.5 * 20 * (Math.PI / 180)) / (Math.PI + gain * 0.5);

    expect(output.channels[0]?.[3]).toBeCloseTo(expected, 6);
    expect(output.channels[0]?.[1]).toBeCloseTo(-expected, 6);
    expect(source.channels[0]?.[3]).toBe(0.5);
  });

  it('generates deterministic, finite, same-length reverb responses', () => {
    const source = mono([1, 0, 0, 0, 0, 0, 0, 0, 0, 0], 10);
    const values = { decay: 0.4, mix: 1, timeSeconds: 1 };
    const first = registry.apply(source, 'reverb', values);
    const second = registry.apply(source, 'reverb', values);

    expect(first.channels[0]).toEqual(second.channels[0]);
    expect(first.channels[0]).toHaveLength(source.channels[0]!.length);
    expect(first.channels[0]?.some((sample) => sample !== 0)).toBe(true);
    expect(first.channels[0]?.every(Number.isFinite)).toBe(true);
  });

  it('keeps reset EQ bit-identical and boosts the selected center frequency', () => {
    const sampleRate = 48_000;
    const source = mono(
      Array.from({ length: sampleRate }, (_, frame) =>
        Math.sin((2 * Math.PI * 1000 * frame) / sampleRate),
      ),
      sampleRate,
    );
    const reset = registry.apply(source, 'graphic-equalizer', {
      gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    const boosted = registry.apply(source, 'graphic-equalizer', {
      gains: [0, 0, 0, 0, 0, 6, 0, 0, 0, 0],
    });

    expect(reset.channels[0]).toEqual(source.channels[0]);
    expect(rms(boosted.channels[0]!, 1000)).toBeGreaterThan(rms(source.channels[0]!, 1000) * 1.8);
    expect(boosted.channels[0]?.every(Number.isFinite)).toBe(true);
  });
});
