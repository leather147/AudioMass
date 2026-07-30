import type { PcmAudio } from '../../types.js';
import type { EffectValues } from '../schema.js';
import { createBiquadCoefficients, filterBiquad, type BiquadType } from './biquad.js';
import { requiredNumberList } from './values.js';

export const GRAPHIC_EQ_FREQUENCIES = [
  32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

export function processGraphicEqualizer(audio: PcmAudio, values: EffectValues): PcmAudio {
  const gains = requiredNumberList(values, 'gains');
  let channels: Float32Array[] = audio.channels.map((channel) => channel.slice());
  for (let band = 0; band < GRAPHIC_EQ_FREQUENCIES.length; band += 1) {
    const gain = gains[band] ?? 0;
    if (gain === 0) continue;
    const type: BiquadType =
      band === 0
        ? 'lowshelf'
        : band === GRAPHIC_EQ_FREQUENCIES.length - 1
          ? 'highshelf'
          : 'peaking';
    const value = createBiquadCoefficients({
      frequency: GRAPHIC_EQ_FREQUENCIES[band]!,
      gainDb: gain,
      q: 4.6,
      sampleRate: audio.sampleRate,
      type,
    });
    channels = channels.map((channel) => filterBiquad(channel, value));
  }
  return { channels, sampleRate: audio.sampleRate };
}
