import type { PcmAudio } from '../../types.js';
import type { EffectValues } from '../schema.js';
import { requiredNumber } from './values.js';

export function processDistortion(audio: PcmAudio, values: EffectValues): PcmAudio {
  const gain = Math.trunc(requiredNumber(values, 'amount') * 100);
  const degrees = Math.PI / 180;
  return {
    channels: audio.channels.map((channel) =>
      Float32Array.from(channel, (sample) => {
        return ((3 + gain) * sample * 20 * degrees) / (Math.PI + gain * Math.abs(sample));
      }),
    ),
    sampleRate: audio.sampleRate,
  };
}
