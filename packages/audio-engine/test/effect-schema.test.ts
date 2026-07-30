import { describe, expect, it } from 'vitest';

import {
  defaultEffectValues,
  EFFECT_SCHEMAS,
  getEffectSchema,
  parseEffectValues,
} from '@audio-engine/index';

describe('effect schema catalog', () => {
  it('exposes validated, unique effect and parameter contracts', () => {
    expect(new Set(EFFECT_SCHEMAS.map((schema) => schema.id)).size).toBe(EFFECT_SCHEMAS.length);
    expect(EFFECT_SCHEMAS.map((schema) => schema.id)).toEqual([
      'gain',
      'compressor',
      'normalize',
      'hard-limiter',
      'delay',
      'distortion',
      'reverb',
      'graphic-equalizer',
      'seamless-loop',
    ]);
    expect(EFFECT_SCHEMAS.flatMap((schema) => schema.builtInPresets)).toHaveLength(45);
    expect(defaultEffectValues(getEffectSchema('compressor'))).toEqual({
      attack: 0.003,
      knee: 30,
      makeup: 0,
      ratio: 12,
      release: 0.25,
      threshold: -24,
    });
  });

  it('retains established built-in values without comma-delimited payloads', () => {
    const gain = getEffectSchema('gain');
    expect(gain.builtInPresets.find((preset) => preset.id === 'plus-100')?.values).toEqual({
      amount: 2,
    });
    const compressor = getEffectSchema('compressor');
    expect(compressor.builtInPresets.find((preset) => preset.id === 'vocal-lead')?.values).toEqual({
      attack: 0.005,
      knee: 6,
      makeup: 6,
      ratio: 3,
      release: 0.15,
      threshold: -18,
    });
  });

  it('fills declared defaults but rejects unknown and out-of-range values', () => {
    const delay = getEffectSchema('delay');
    expect(parseEffectValues(delay, { delaySeconds: 1 })).toEqual({
      delaySeconds: 1,
      feedback: 0.5,
      mix: 0.4,
    });
    expect(() => parseEffectValues(delay, { surprise: 1 })).toThrow('Unknown delay parameter');
    expect(() => parseEffectValues(delay, { feedback: 2 })).toThrow('feedback must be');
    expect(() => parseEffectValues(delay, { feedback: null })).toThrow('feedback must be');
    expect(() =>
      parseEffectValues(getEffectSchema('graphic-equalizer'), { gains: [0, 1] }),
    ).toThrow('must contain 10 numbers');
  });
});
