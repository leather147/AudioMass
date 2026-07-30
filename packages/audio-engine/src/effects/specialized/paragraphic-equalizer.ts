import type { PcmAudio } from '../../types.js';
import { createBiquadCoefficients, filterBiquad } from '../processors/biquad.js';
import type { ParagraphicEqualizerWorkflow } from './models.js';

export function processParagraphicEqualizer(
  audio: PcmAudio,
  workflow: ParagraphicEqualizerWorkflow,
): PcmAudio {
  let channels: Float32Array[] = audio.channels.map((channel) => channel.slice());
  const bands = workflow.bands
    .filter((band) => band.enabled)
    .sort((left, right) => {
      if (left.type === 'peaking' && right.type !== 'peaking') return -1;
      if (right.type === 'peaking' && left.type !== 'peaking') return 1;
      return 0;
    });
  for (const band of bands) {
    if (band.type === 'peaking' && band.gainDb === 0) continue;
    const coefficients = createBiquadCoefficients({
      frequency: band.frequency,
      gainDb: band.gainDb,
      q: band.q,
      sampleRate: audio.sampleRate,
      type: band.type,
    });
    channels = channels.map((channel) => filterBiquad(channel, coefficients));
  }
  return { channels, sampleRate: audio.sampleRate };
}
