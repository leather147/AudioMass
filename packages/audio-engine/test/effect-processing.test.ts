import { describe, expect, it } from 'vitest';

import { EffectProcessorRegistry } from '@audio-engine/effects/processing';
import type { PcmAudio } from '@audio-engine/types';

const stereo: PcmAudio = {
  channels: [Float32Array.from([0.25, -0.5]), Float32Array.from([0.1, -0.2])],
  sampleRate: 2,
};

describe('native effect processor registry', () => {
  it('applies typed gain without mutating source PCM', () => {
    const registry = new EffectProcessorRegistry();
    const output = registry.apply(stereo, 'gain', { amount: 2 });

    expect(Array.from(output.channels[0] ?? [])).toEqual([0.5, -1]);
    expect(Array.from(stereo.channels[0] ?? [])).toEqual([0.25, -0.5]);
    expect(registry.supportedEffectIds).toEqual(['gain', 'normalize']);
  });

  it('normalizes peaks either as linked channels or independently', () => {
    const registry = new EffectProcessorRegistry();
    const linked = registry.apply(stereo, 'normalize', {
      amount: 1,
      linked: true,
      mode: 'peak',
      peakCeiling: -1,
      targetLufs: -14,
    });
    const independent = registry.apply(stereo, 'normalize', {
      amount: 1,
      linked: false,
      mode: 'peak',
      peakCeiling: -1,
      targetLufs: -14,
    });

    expect(linked.channels[0]?.[1]).toBe(-1);
    expect(linked.channels[1]?.[1]).toBeCloseTo(-0.4);
    expect(independent.channels[0]?.[1]).toBe(-1);
    expect(independent.channels[1]?.[1]).toBe(-1);
  });

  it('supports RMS and LUFS normalization through the same validated contract', () => {
    const registry = new EffectProcessorRegistry();
    const rms = registry.apply(stereo, 'normalize', {
      amount: 0.25,
      linked: true,
      mode: 'rms',
      peakCeiling: -1,
      targetLufs: -14,
    });
    const lufs = registry.apply(stereo, 'normalize', {
      amount: 1,
      linked: true,
      mode: 'lufs',
      peakCeiling: -1,
      targetLufs: -14,
    });

    const rmsValue = Math.sqrt(
      [...(rms.channels[0] ?? []), ...(rms.channels[1] ?? [])].reduce(
        (sum, sample) => sum + sample * sample,
        0,
      ) / 4,
    );
    expect(rmsValue).toBeCloseTo(0.25);
    expect(lufs.channels).toHaveLength(2);
    expect(lufs.channels[0]).not.toBe(stereo.channels[0]);
  });

  it('fails closed for unavailable processors and invalid values', () => {
    const registry = new EffectProcessorRegistry();

    expect(() => registry.apply(stereo, 'compressor', {})).toThrow(/native processor/i);
    expect(() => registry.apply(stereo, 'gain', { amount: 9 })).toThrow(/0 to 2.5/);
  });
});
