import type { PcmAudio } from '../../types.js';
import type { EffectValues } from '../schema.js';
import { requiredNumberList } from './values.js';

export const GRAPHIC_EQ_FREQUENCIES = [
  32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

interface BiquadCoefficients {
  a1: number;
  a2: number;
  b0: number;
  b1: number;
  b2: number;
}

type BiquadType = 'highshelf' | 'lowshelf' | 'peaking';

function normalizeCoefficients(
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number,
): BiquadCoefficients {
  return { a1: a1 / a0, a2: a2 / a0, b0: b0 / a0, b1: b1 / a0, b2: b2 / a0 };
}

function shelfCoefficients(
  type: 'highshelf' | 'lowshelf',
  frequency: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  const amplitude = 10 ** (gainDb / 40);
  const angle = (2 * Math.PI * frequency) / sampleRate;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const alpha = (sine / 2) * Math.sqrt(2);
  const beta = 2 * Math.sqrt(amplitude) * alpha;
  if (type === 'lowshelf') {
    return normalizeCoefficients(
      amplitude * (amplitude + 1 - (amplitude - 1) * cosine + beta),
      2 * amplitude * (amplitude - 1 - (amplitude + 1) * cosine),
      amplitude * (amplitude + 1 - (amplitude - 1) * cosine - beta),
      amplitude + 1 + (amplitude - 1) * cosine + beta,
      -2 * (amplitude - 1 + (amplitude + 1) * cosine),
      amplitude + 1 + (amplitude - 1) * cosine - beta,
    );
  }
  return normalizeCoefficients(
    amplitude * (amplitude + 1 + (amplitude - 1) * cosine + beta),
    -2 * amplitude * (amplitude - 1 + (amplitude + 1) * cosine),
    amplitude * (amplitude + 1 + (amplitude - 1) * cosine - beta),
    amplitude + 1 - (amplitude - 1) * cosine + beta,
    2 * (amplitude - 1 - (amplitude + 1) * cosine),
    amplitude + 1 - (amplitude - 1) * cosine - beta,
  );
}

function peakingCoefficients(
  frequency: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  const amplitude = 10 ** (gainDb / 40);
  const angle = (2 * Math.PI * frequency) / sampleRate;
  const alpha = Math.sin(angle) / (2 * 4.6);
  const cosine = Math.cos(angle);
  return normalizeCoefficients(
    1 + alpha * amplitude,
    -2 * cosine,
    1 - alpha * amplitude,
    1 + alpha / amplitude,
    -2 * cosine,
    1 - alpha / amplitude,
  );
}

function coefficients(
  type: BiquadType,
  frequency: number,
  gainDb: number,
  sampleRate: number,
): BiquadCoefficients {
  const safeFrequency = Math.max(1, Math.min(frequency, sampleRate * 0.45));
  return type === 'peaking'
    ? peakingCoefficients(safeFrequency, gainDb, sampleRate)
    : shelfCoefficients(type, safeFrequency, gainDb, sampleRate);
}

function filterChannel(source: Float32Array, value: BiquadCoefficients): Float32Array {
  const output = new Float32Array(source.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let index = 0; index < source.length; index += 1) {
    const x0 = source[index] ?? 0;
    const y0 = value.b0 * x0 + value.b1 * x1 + value.b2 * x2 - value.a1 * y1 - value.a2 * y2;
    output[index] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return output;
}

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
    const value = coefficients(type, GRAPHIC_EQ_FREQUENCIES[band]!, gain, audio.sampleRate);
    channels = channels.map((channel) => filterChannel(channel, value));
  }
  return { channels, sampleRate: audio.sampleRate };
}
