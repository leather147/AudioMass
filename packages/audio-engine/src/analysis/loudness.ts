import type { AudioBufferView } from './tempo.js';

export const BS1770_BLOCK = {
  absoluteGate: -70,
  duration: 0.4,
  hop: 0.1,
  loudnessOffset: -0.691,
  relativeGate: -10,
  truePeakSteps: 4,
} as const;

export interface LoudnessReport {
  blocks: number;
  lufs: number;
  peak: number;
  peakDb: number;
  rms: number;
  rmsDb: number;
  truePeak: number;
  truePeakDb: number;
}

export interface LoudnessNormalization {
  expectedLUFS: number;
  expectedTruePeakDb: number;
  gain: number;
  gainDb: number;
  limited: boolean;
}

interface BiquadCoefficients {
  a1: number;
  a2: number;
  b0: number;
  b1: number;
  b2: number;
}

interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export function amplitudeToDb(value: number): number {
  return value > 0 ? 20 * Math.log10(value) : -120;
}

function loudness(energy: number): number {
  return energy > 0
    ? BS1770_BLOCK.loudnessOffset + 10 * Math.log10(energy)
    : Number.NEGATIVE_INFINITY;
}

function coefficients(
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number,
): BiquadCoefficients {
  return { a1: a1 / a0, a2: a2 / a0, b0: b0 / a0, b1: b1 / a0, b2: b2 / a0 };
}

function highShelf(rate: number): BiquadCoefficients {
  const frequency = Math.min(1681.974450955533, rate * 0.45);
  const quality = 0.7071752369554196;
  const gain = 3.999843853973347;
  const amplitude = 10 ** (gain / 40);
  const angle = (2 * Math.PI * frequency) / rate;
  const sine = Math.sin(angle);
  const cosine = Math.cos(angle);
  const alpha = sine / (2 * quality);
  const root = Math.sqrt(amplitude);
  return coefficients(
    amplitude * (amplitude + 1 + (amplitude - 1) * cosine + 2 * root * alpha),
    -2 * amplitude * (amplitude - 1 + (amplitude + 1) * cosine),
    amplitude * (amplitude + 1 + (amplitude - 1) * cosine - 2 * root * alpha),
    amplitude + 1 - (amplitude - 1) * cosine + 2 * root * alpha,
    2 * (amplitude - 1 - (amplitude + 1) * cosine),
    amplitude + 1 - (amplitude - 1) * cosine - 2 * root * alpha,
  );
}

function highPass(rate: number): BiquadCoefficients {
  const frequency = Math.min(38.13547087602444, rate * 0.45);
  const quality = 0.5003270373238773;
  const angle = (2 * Math.PI * frequency) / rate;
  const sine = Math.sin(angle);
  const cosine = Math.cos(angle);
  const alpha = sine / (2 * quality);
  return coefficients(
    (1 + cosine) / 2,
    -(1 + cosine),
    (1 + cosine) / 2,
    1 + alpha,
    -2 * cosine,
    1 - alpha,
  );
}

function biquad(sample: number, value: BiquadCoefficients, state: BiquadState): number {
  const output =
    value.b0 * sample +
    value.b1 * state.x1 +
    value.b2 * state.x2 -
    value.a1 * state.y1 -
    value.a2 * state.y2;
  state.x2 = state.x1;
  state.x1 = sample;
  state.y2 = state.y1;
  state.y1 = output;
  return output;
}

function interpolate(a: number, b: number, c: number, d: number, progress: number): number {
  const squared = progress * progress;
  return (
    0.5 *
    (2 * b +
      (-a + c) * progress +
      (2 * a - 5 * b + 4 * c - d) * squared +
      (-a + 3 * b - 3 * c + d) * squared * progress)
  );
}

export function analyzeLoudness(buffer: AudioBufferView): LoudnessReport {
  const { length, numberOfChannels, sampleRate } = buffer;
  if (numberOfChannels < 1 || sampleRate <= 0) throw new TypeError('Audio buffer is invalid.');
  let hop = Math.max(1, Math.trunc(sampleRate * BS1770_BLOCK.hop));
  let block = Math.max(1, hop * 4);
  if (length < block) {
    block = length;
    hop = length || 1;
  }
  const blocks = length <= block ? 1 : Math.trunc((length - block) / hop) + 1;
  const sums = new Float64Array(blocks);
  const slots = Math.max(1, Math.trunc(block / hop));
  let total = 0;
  let peak = 0;
  let truePeak = 0;

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    const weight = channel > 2 ? 1.41 : 1;
    const indexes = Array.from<number>({ length: slots }).fill(-1);
    const accumulators = Array.from<number>({ length: slots }).fill(0);
    const shelfState: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    const passState: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    const shelf = highShelf(sampleRate);
    const pass = highPass(sampleRate);
    let next = 0;
    let blockIndex = 0;
    const flush = (slot: number) => {
      const index = indexes[slot] ?? -1;
      if (index < 0) return;
      sums[index] = (sums[index] ?? 0) + (accumulators[slot] ?? 0) * weight;
      indexes[slot] = -1;
      accumulators[slot] = 0;
    };
    for (let index = 0; index < length; index += 1) {
      if (index === next) {
        const slot = blockIndex % slots;
        flush(slot);
        if (blockIndex < blocks) indexes[slot] = blockIndex;
        blockIndex += 1;
        next += hop;
      }
      const sample = data[index] ?? 0;
      const filtered = biquad(biquad(sample, shelf, shelfState), pass, passState);
      total += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
      truePeak = Math.max(truePeak, Math.abs(sample));
      if (index < length - 1) {
        const previous = index ? (data[index - 1] ?? sample) : sample;
        const nextSample = data[index + 1] ?? sample;
        const following = index < length - 2 ? (data[index + 2] ?? nextSample) : nextSample;
        for (let step = 1; step < BS1770_BLOCK.truePeakSteps; step += 1) {
          truePeak = Math.max(
            truePeak,
            Math.abs(
              interpolate(
                previous,
                sample,
                nextSample,
                following,
                step / BS1770_BLOCK.truePeakSteps,
              ),
            ),
          );
        }
      }
      for (let slot = 0; slot < slots; slot += 1) {
        if ((indexes[slot] ?? -1) >= 0)
          accumulators[slot] = (accumulators[slot] ?? 0) + filtered * filtered;
      }
    }
    for (let slot = 0; slot < slots; slot += 1) flush(slot);
  }

  let energies = Array.from(sums, (sum) => sum / Math.max(1, block)).filter(
    (energy) => loudness(energy) >= BS1770_BLOCK.absoluteGate,
  );
  let lufs = Number.NEGATIVE_INFINITY;
  if (energies.length) {
    const gate =
      loudness(energies.reduce((sum, value) => sum + value, 0) / energies.length) +
      BS1770_BLOCK.relativeGate;
    energies = energies.filter((energy) => loudness(energy) >= gate);
    if (energies.length)
      lufs = loudness(energies.reduce((sum, value) => sum + value, 0) / energies.length);
  }
  const rms = Math.sqrt(total / Math.max(1, length * numberOfChannels));
  return {
    blocks,
    lufs,
    peak,
    peakDb: amplitudeToDb(peak),
    rms,
    rmsDb: amplitudeToDb(rms),
    truePeak,
    truePeakDb: amplitudeToDb(truePeak),
  };
}

export function gainForLoudnessTarget(
  report: LoudnessReport,
  targetLufs: number,
  truePeakCeilingDb = -1,
): LoudnessNormalization {
  if (!Number.isFinite(targetLufs) || !Number.isFinite(truePeakCeilingDb)) {
    throw new TypeError('Loudness target and ceiling must be finite.');
  }
  let gainDb = Number.isFinite(report.lufs) ? targetLufs - report.lufs : 0;
  const maximumGain = truePeakCeilingDb - report.truePeakDb;
  const limited = gainDb > maximumGain;
  if (limited) gainDb = maximumGain;
  return {
    expectedLUFS: Number.isFinite(report.lufs) ? report.lufs + gainDb : report.lufs,
    expectedTruePeakDb: report.truePeakDb + gainDb,
    gain: 10 ** (gainDb / 20),
    gainDb,
    limited,
  };
}
