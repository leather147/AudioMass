import { describe, expect, it } from 'vitest';

import {
  createEffectPreset,
  deserializeEffectPresetDocument,
  effectPresetsFor,
  emptyEffectPresetDocument,
  migrateLegacyEffectPresets,
  serializeEffectPresetDocument,
  upsertEffectPreset,
} from '@audio-engine/index';

describe('versioned effect preset documents', () => {
  it('round-trips typed values and updates an id without duplicating it', () => {
    const preset = createEffectPreset({
      createdAt: '2026-07-30T00:00:00.000Z',
      effectId: 'delay',
      id: 'delay-custom',
      name: 'My Delay',
      updatedAt: '2026-07-30T00:00:00.000Z',
      values: { delaySeconds: 0.4, feedback: 0.25, mix: 0.5 },
    });
    const first = upsertEffectPreset(emptyEffectPresetDocument(), preset);
    const updated = upsertEffectPreset(first, {
      ...preset,
      name: 'Short Delay',
      updatedAt: '2026-07-30T01:00:00.000Z',
    });
    const roundTrip = deserializeEffectPresetDocument(serializeEffectPresetDocument(updated));

    expect(roundTrip.presets).toHaveLength(1);
    expect(effectPresetsFor(roundTrip, 'delay')[0]).toMatchObject({
      createdAt: '2026-07-30T00:00:00.000Z',
      name: 'Short Delay',
    });
  });

  it('rejects unknown effects, unsafe names, invalid values, and duplicate ids', () => {
    expect(() =>
      createEffectPreset({ effectId: 'missing', id: 'x', name: 'Name', values: {} }),
    ).toThrow('Unknown effect');
    expect(() =>
      createEffectPreset({ effectId: 'gain', id: 'x', name: 'A'.repeat(17), values: {} }),
    ).toThrow('at most 16');
    expect(() =>
      createEffectPreset({ effectId: 'gain', id: 'x', name: 'Gain', values: { amount: 9 } }),
    ).toThrow('amount must be');
    expect(() =>
      deserializeEffectPresetDocument(
        JSON.stringify({
          format: 'audiomass-effect-presets',
          presets: [
            {
              createdAt: '2026-07-30T00:00:00.000Z',
              effectId: 'gain',
              id: 'same',
              name: 'One',
              updatedAt: '2026-07-30T00:00:00.000Z',
              values: { amount: 1 },
            },
            {
              createdAt: '2026-07-30T00:00:00.000Z',
              effectId: 'gain',
              id: 'same',
              name: 'Two',
              updatedAt: '2026-07-30T00:00:00.000Z',
              values: { amount: 1 },
            },
          ],
          version: 1,
        }),
      ),
    ).toThrow('Duplicate effect preset id');
  });

  it('migrates only unambiguous valid legacy positional presets', () => {
    const migrated = migrateLegacyEffectPresets({
      compressor: [
        {
          date: 1_722_297_600_000,
          id: 'compressor_voice',
          name: 'Voice &amp; Air',
          val: '-18,6,3,0.005,0.15,6',
        },
      ],
      gain: [
        { date: 1_722_297_600_000, id: 'gain_good', name: 'Quiet', val: '0.5' },
        { date: 1_722_297_600_000, id: 'gain_bad', name: 'Invalid', val: '9' },
      ],
      paragraphic_eq: [{ id: 'unsupported', name: 'Dynamic', val: '1,2,3' }],
    });

    expect(migrated.presets).toHaveLength(2);
    expect(effectPresetsFor(migrated, 'compressor')[0]).toMatchObject({
      name: 'Voice & Air',
      values: { attack: 0.005, knee: 6, makeup: 6, ratio: 3, release: 0.15, threshold: -18 },
    });
    expect(effectPresetsFor(migrated, 'gain')[0]?.values).toEqual({ amount: 0.5 });
  });
});
