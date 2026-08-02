import { AudioEngineError } from '../errors.js';
import { assertValidPcm } from '../dsp/pcm.js';
import type { PcmAudio } from '../types.js';

export interface FrequencyAnalysisOptions {
  fftSize?: number;
  frameCount?: number;
  maxFrequency?: number;
}

export interface FrequencySpectrum {
  frequencies: Float32Array;
  magnitudesDb: Float32Array;
  sampleRate: number;
}

export interface SpectrogramAnalysis {
  duration: number;
  frameCount: number;
  frequencies: Float32Array;
  magnitudesDb: Float32Array;
  times: Float32Array;
}

export interface FrequencyAnalysis {
  spectrogram: SpectrogramAnalysis;
  spectrum: FrequencySpectrum;
}

interface NormalizedOptions {
  fftSize: number;
  frameCount: number;
  maxFrequency: number;
}

const MIN_DECIBELS = -120;
const MAX_DECIBELS = 0;

function normalizeOptions(audio: PcmAudio, options: FrequencyAnalysisOptions): NormalizedOptions {
  const fftSize = options.fftSize ?? 2048;
  if (
    !Number.isInteger(fftSize) ||
    fftSize < 256 ||
    fftSize > 4096 ||
    (fftSize & (fftSize - 1)) !== 0
  ) {
    throw new AudioEngineError(
      'INVALID_AUDIO_DATA',
      'FFT size must be a power of two between 256 and 4096.',
    );
  }
  const frameCount = options.frameCount ?? 96;
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > 256) {
    throw new AudioEngineError(
      'INVALID_AUDIO_DATA',
      'Spectrogram frame count must be within 1..256.',
    );
  }
  const nyquist = audio.sampleRate / 2;
  const maxFrequency = options.maxFrequency ?? nyquist;
  if (!Number.isFinite(maxFrequency) || maxFrequency <= 0) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'Maximum frequency must be positive.');
  }
  return { fftSize, frameCount, maxFrequency: Math.min(maxFrequency, nyquist) };
}

function mixChannels(audio: PcmAudio): Float32Array {
  const length = audio.channels[0]?.length ?? 0;
  const mixed = new Float32Array(length);
  for (const channel of audio.channels) {
    for (let index = 0; index < length; index += 1) {
      mixed[index] = (mixed[index] ?? 0) + (channel[index] ?? 0);
    }
  }
  const scale = 1 / audio.channels.length;
  for (let index = 0; index < length; index += 1) mixed[index] = (mixed[index] ?? 0) * scale;
  return mixed;
}

function reverseBits(value: number, bits: number): number {
  let reversed = 0;
  for (let bit = 0; bit < bits; bit += 1) {
    reversed = (reversed << 1) | (value & 1);
    value >>>= 1;
  }
  return reversed;
}

function transform(real: Float64Array, imaginary: Float64Array): void {
  const length = real.length;
  const bits = Math.log2(length);
  for (let index = 0; index < length; index += 1) {
    const reversed = reverseBits(index, bits);
    if (reversed <= index) continue;
    [real[index], real[reversed]] = [real[reversed] ?? 0, real[index] ?? 0];
  }
  for (let size = 2; size <= length; size *= 2) {
    const half = size / 2;
    const angleStep = (-2 * Math.PI) / size;
    for (let start = 0; start < length; start += size) {
      for (let offset = 0; offset < half; offset += 1) {
        const angle = angleStep * offset;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const even = start + offset;
        const odd = even + half;
        const oddReal = (real[odd] ?? 0) * cosine - (imaginary[odd] ?? 0) * sine;
        const oddImaginary = (real[odd] ?? 0) * sine + (imaginary[odd] ?? 0) * cosine;
        const evenReal = real[even] ?? 0;
        const evenImaginary = imaginary[even] ?? 0;
        real[even] = evenReal + oddReal;
        imaginary[even] = evenImaginary + oddImaginary;
        real[odd] = evenReal - oddReal;
        imaginary[odd] = evenImaginary - oddImaginary;
      }
    }
  }
}

function frameMagnitudes(
  input: Float32Array,
  start: number,
  fftSize: number,
  binCount: number,
): Float64Array {
  const real = new Float64Array(fftSize);
  const imaginary = new Float64Array(fftSize);
  let windowSum = 0;
  for (let index = 0; index < fftSize; index += 1) {
    const window = fftSize === 1 ? 1 : 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (fftSize - 1));
    real[index] = (input[start + index] ?? 0) * window;
    windowSum += window;
  }
  transform(real, imaginary);
  const magnitudes = new Float64Array(binCount);
  const scale = 2 / Math.max(windowSum, 1);
  for (let bin = 0; bin < binCount; bin += 1) {
    magnitudes[bin] = Math.hypot(real[bin] ?? 0, imaginary[bin] ?? 0) * scale;
  }
  return magnitudes;
}

function toDecibels(magnitude: number): number {
  return Math.max(MIN_DECIBELS, Math.min(MAX_DECIBELS, 20 * Math.log10(Math.max(magnitude, 1e-6))));
}

export function analyzeFrequency(
  audio: PcmAudio,
  options: FrequencyAnalysisOptions = {},
): FrequencyAnalysis {
  assertValidPcm(audio);
  const normalized = normalizeOptions(audio, options);
  const input = mixChannels(audio);
  const duration = input.length / audio.sampleRate;
  const frequencyStep = audio.sampleRate / normalized.fftSize;
  const binCount = Math.min(
    normalized.fftSize / 2 + 1,
    Math.floor(normalized.maxFrequency / frequencyStep) + 1,
  );
  const frequencies = Float32Array.from({ length: binCount }, (_, bin) => bin * frequencyStep);
  const times = new Float32Array(normalized.frameCount);
  const magnitudesDb = new Float32Array(normalized.frameCount * binCount);
  const averageMagnitudes = new Float64Array(binCount);
  const maximumStart = Math.max(0, input.length - normalized.fftSize);

  for (let frame = 0; frame < normalized.frameCount; frame += 1) {
    const progress = normalized.frameCount === 1 ? 0.5 : frame / (normalized.frameCount - 1);
    const start = Math.round(maximumStart * progress);
    times[frame] = Math.min(duration, (start + normalized.fftSize / 2) / audio.sampleRate);
    const magnitudes = frameMagnitudes(input, start, normalized.fftSize, binCount);
    for (let bin = 0; bin < binCount; bin += 1) {
      const magnitude = magnitudes[bin] ?? 0;
      averageMagnitudes[bin] = (averageMagnitudes[bin] ?? 0) + magnitude;
      magnitudesDb[frame * binCount + bin] = toDecibels(magnitude);
    }
  }

  return {
    spectrogram: {
      duration,
      frameCount: normalized.frameCount,
      frequencies,
      magnitudesDb,
      times,
    },
    spectrum: {
      frequencies,
      magnitudesDb: Float32Array.from(averageMagnitudes, (value) =>
        toDecibels(value / normalized.frameCount),
      ),
      sampleRate: audio.sampleRate,
    },
  };
}
