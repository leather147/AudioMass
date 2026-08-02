export interface AudioBufferView {
  readonly duration: number;
  readonly length: number;
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

export interface TempoOptions {
  maxTempo?: number;
  minTempo?: number;
}

export interface TempoResult {
  beats: number;
  bpm: number;
  confidence: number;
  duration: number;
  offset: number;
  tempo: number;
}

interface FluxEnvelope {
  data: Float32Array;
  rate: number;
}

interface Peak {
  position: number;
  value: number;
}

function scoreLag(flux: Float32Array, lag: number): number {
  let score = 0;
  const length = flux.length - lag;
  if (length <= 0) return 0;
  for (let index = lag; index < flux.length; index += 1) {
    score += (flux[index] ?? 0) * (flux[index - lag] ?? 0);
  }
  return score / length;
}

function makeFlux(buffer: AudioBufferView): FluxEnvelope {
  const hop = Math.max(256, Math.trunc(buffer.sampleRate / 100));
  const frames = Math.max(1, Math.trunc(buffer.length / hop));
  const envelope = new Float32Array(frames);
  const first = buffer.getChannelData(0);
  const second = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : undefined;
  for (let frame = 0; frame < frames; frame += 1) {
    const start = frame * hop;
    const end = Math.min(buffer.length, start + hop);
    let sum = 0;
    for (let index = start; index < end; index += 1) {
      sum += Math.abs(first[index] ?? 0) + (second ? Math.abs(second[index] ?? 0) : 0);
    }
    envelope[frame] = sum / Math.max(1, (end - start) * (second ? 2 : 1));
  }
  const flux = new Float32Array(frames);
  let mean = envelope[0] ?? 0;
  flux[0] = mean;
  for (let frame = 1; frame < frames; frame += 1) {
    const value = (envelope[frame] ?? 0) - (envelope[frame - 1] ?? 0);
    if (value > 0) {
      flux[frame] = value;
      mean += value;
    }
  }
  mean = (mean / Math.max(1, frames)) * 1.25;
  for (let frame = 0; frame < frames; frame += 1) {
    flux[frame] = Math.max(0, (flux[frame] ?? 0) - mean);
  }
  return { data: flux, rate: buffer.sampleRate / hop };
}

function foldTempo(tempo: number, minimum: number, maximum: number): number {
  let folded = tempo;
  while (folded < minimum) folded *= 2;
  while (folded > maximum) folded /= 2;
  return folded;
}

function pickPeaks(flux: Float32Array, rate: number): Peak[] {
  const peaks: Peak[] = [];
  const hold = Math.max(1, Math.trunc(rate * 0.08));
  let last = -hold;
  for (let index = 1; index < flux.length - 1; index += 1) {
    if (index - last < hold) continue;
    const value = flux[index] ?? 0;
    if (value <= (flux[index - 1] ?? 0) || value < (flux[index + 1] ?? 0) || value <= 0) continue;
    peaks.push({ position: index, value });
    last = index;
  }
  peaks.sort((left, right) => right.value - left.value);
  peaks.length = Math.min(peaks.length, 320);
  return peaks.sort((left, right) => left.position - right.position);
}

function intervalTempo(
  flux: Float32Array,
  rate: number,
  minimum: number,
  maximum: number,
): { confidence: number; tempo: number } {
  const peaks = pickPeaks(flux, rate);
  const bins = new Map<number, number>();
  let bestTempo = 0;
  let bestScore = 0;
  let secondScore = 0;
  for (let first = 0; first < peaks.length; first += 1) {
    for (let second = first + 1; second < peaks.length && second < first + 16; second += 1) {
      const left = peaks[first]!;
      const right = peaks[second]!;
      const distance = (right.position - left.position) / rate;
      if (distance <= 0) continue;
      const key = Math.round(foldTempo(60 / distance, minimum, maximum));
      bins.set(key, (bins.get(key) ?? 0) + (left.value + right.value) / (second - first));
    }
  }
  for (const [tempo, score] of bins) {
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestTempo = tempo;
    } else if (score > secondScore) secondScore = score;
  }
  return {
    confidence: bestScore ? (bestScore - secondScore) / bestScore : 0,
    tempo: bestTempo,
  };
}

export function analyzeTempo(buffer: AudioBufferView, options: TempoOptions = {}): TempoResult {
  if (!buffer.length || buffer.duration < 2)
    throw new Error('Audio is too short to estimate tempo.');
  const minimum = options.minTempo ?? 60;
  const maximum = options.maxTempo ?? 200;
  if (!(minimum > 0 && maximum > minimum)) throw new RangeError('Tempo range is invalid.');
  const { data: flux, rate } = makeFlux(buffer);
  const minimumLag = Math.max(1, Math.round((rate * 60) / maximum));
  const maximumLag = Math.min(flux.length - 1, Math.round((rate * 60) / minimum));
  let bestLag = 0;
  let bestScore = 0;
  let secondScore = 0;
  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let score = scoreLag(flux, lag);
    if (lag * 2 < flux.length) score += scoreLag(flux, lag * 2) * 0.35;
    if (lag * 3 < flux.length) score += scoreLag(flux, lag * 3) * 0.2;
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestLag = lag;
    } else if (score > secondScore) secondScore = score;
  }
  if (!bestLag || !bestScore) throw new Error('Could not find a reliable tempo.');

  let tempo = (60 * rate) / bestLag;
  const interval = intervalTempo(flux, rate, minimum, maximum);
  if (interval.tempo) {
    const ratio = Math.max(tempo, interval.tempo) / Math.min(tempo, interval.tempo);
    if (ratio > 1.85 && ratio < 2.15) tempo = interval.tempo;
    else if (Math.abs(tempo - interval.tempo) < 8) tempo = (tempo + interval.tempo) / 2;
    else if (interval.confidence > 0.25) tempo = interval.tempo;
    bestLag = Math.max(1, Math.round((rate * 60) / tempo));
  }

  let phase = 0;
  let phaseScore = 0;
  for (let candidate = 0; candidate < Math.min(bestLag, flux.length); candidate += 1) {
    let score = 0;
    for (let index = candidate; index < flux.length; index += bestLag) score += flux[index] ?? 0;
    if (score > phaseScore) {
      phaseScore = score;
      phase = candidate;
    }
  }
  const period = bestLag / rate;
  const offset = phase / rate;
  const confidence = Math.max(
    0,
    Math.min(100, Math.max((bestScore - secondScore) / bestScore, interval.confidence) * 100),
  );
  return {
    beats: Math.max(0, Math.floor((buffer.duration - offset) / period)),
    bpm: Math.round(tempo),
    confidence: Math.round(confidence),
    duration: Math.round(buffer.duration * 10) / 10,
    offset: Math.round(offset * 1_000) / 1_000,
    tempo: Math.round(tempo * 10) / 10,
  };
}

export async function estimateTempo(
  buffer: AudioBufferView,
  options?: TempoOptions,
): Promise<TempoResult> {
  await Promise.resolve();
  return analyzeTempo(buffer, options);
}
