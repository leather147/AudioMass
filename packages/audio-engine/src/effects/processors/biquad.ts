export type BiquadType = 'highpass' | 'highshelf' | 'lowpass' | 'lowshelf' | 'notch' | 'peaking';

export interface BiquadCoefficients {
  a1: number;
  a2: number;
  b0: number;
  b1: number;
  b2: number;
}

export interface BiquadParameters {
  frequency: number;
  gainDb?: number;
  q?: number;
  sampleRate: number;
  type: BiquadType;
}

function normalize(
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number,
): BiquadCoefficients {
  return { a1: a1 / a0, a2: a2 / a0, b0: b0 / a0, b1: b1 / a0, b2: b2 / a0 };
}

function shelf(
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
    return normalize(
      amplitude * (amplitude + 1 - (amplitude - 1) * cosine + beta),
      2 * amplitude * (amplitude - 1 - (amplitude + 1) * cosine),
      amplitude * (amplitude + 1 - (amplitude - 1) * cosine - beta),
      amplitude + 1 + (amplitude - 1) * cosine + beta,
      -2 * (amplitude - 1 + (amplitude + 1) * cosine),
      amplitude + 1 + (amplitude - 1) * cosine - beta,
    );
  }
  return normalize(
    amplitude * (amplitude + 1 + (amplitude - 1) * cosine + beta),
    -2 * amplitude * (amplitude - 1 + (amplitude + 1) * cosine),
    amplitude * (amplitude + 1 + (amplitude - 1) * cosine - beta),
    amplitude + 1 - (amplitude - 1) * cosine + beta,
    2 * (amplitude - 1 - (amplitude + 1) * cosine),
    amplitude + 1 - (amplitude - 1) * cosine - beta,
  );
}

export function createBiquadCoefficients({
  frequency,
  gainDb = 0,
  q = 1,
  sampleRate,
  type,
}: BiquadParameters): BiquadCoefficients {
  const safeFrequency = Math.max(1, Math.min(frequency, sampleRate * 0.45));
  if (type === 'highshelf' || type === 'lowshelf') {
    return shelf(type, safeFrequency, gainDb, sampleRate);
  }
  const angle = (2 * Math.PI * safeFrequency) / sampleRate;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const alpha = sine / (2 * Math.max(0.0001, q));
  if (type === 'peaking') {
    const amplitude = 10 ** (gainDb / 40);
    return normalize(
      1 + alpha * amplitude,
      -2 * cosine,
      1 - alpha * amplitude,
      1 + alpha / amplitude,
      -2 * cosine,
      1 - alpha / amplitude,
    );
  }
  if (type === 'lowpass') {
    return normalize(
      (1 - cosine) / 2,
      1 - cosine,
      (1 - cosine) / 2,
      1 + alpha,
      -2 * cosine,
      1 - alpha,
    );
  }
  if (type === 'highpass') {
    return normalize(
      (1 + cosine) / 2,
      -(1 + cosine),
      (1 + cosine) / 2,
      1 + alpha,
      -2 * cosine,
      1 - alpha,
    );
  }
  return normalize(1, -2 * cosine, 1, 1 + alpha, -2 * cosine, 1 - alpha);
}

export function filterBiquad(source: Float32Array, coefficients: BiquadCoefficients): Float32Array {
  const output = new Float32Array(source.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let index = 0; index < source.length; index += 1) {
    const x0 = source[index] ?? 0;
    const y0 =
      coefficients.b0 * x0 +
      coefficients.b1 * x1 +
      coefficients.b2 * x2 -
      coefficients.a1 * y1 -
      coefficients.a2 * y2;
    output[index] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return output;
}
