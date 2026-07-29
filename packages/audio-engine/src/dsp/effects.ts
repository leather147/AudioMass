export interface ChannelLevel {
  peak: number;
  rms: number;
}

export interface PeakNormalizationStats {
  maxPeak: number;
  peaks: readonly number[];
}

export interface RmsNormalizationStats {
  channels: readonly ChannelLevel[];
  peak: number;
  rms: number;
}

export interface PlaybackRatePoint {
  position: number;
  value: number;
}

export interface PlaybackRateProfile {
  points: readonly PlaybackRatePoint[];
  type: 'profile';
}

export type PlaybackRate = number | PlaybackRateProfile;
export type ChannelGainGraph = GainNode | readonly AudioNode[];

export function clampPlaybackRate(value: number): number {
  return Math.max(0.05, Math.min(4, Number.isFinite(value) ? value : 1));
}

export function createFadeCurve(
  curve: (progress: number) => number,
  reverse = false,
  samples = 32,
): Float32Array {
  if (!Number.isInteger(samples) || samples < 2) throw new RangeError('Fade curve is too short.');
  return Float32Array.from({ length: samples }, (_, index) => {
    const progress = index / (samples - 1);
    return curve(reverse ? 1 - progress : progress);
  });
}

export function createGainGraph(
  context: BaseAudioContext,
  source: AudioNode,
  destination: AudioNode,
  gain = 1,
): GainNode {
  const node = context.createGain();
  node.gain.value = Number.isFinite(gain) ? gain : 1;
  source.connect(node);
  node.connect(destination);
  return node;
}

export function setGain(
  node: GainNode,
  context: Pick<BaseAudioContext, 'currentTime'>,
  gain: number,
): void {
  node.gain.cancelScheduledValues(context.currentTime);
  node.gain.setTargetAtTime(Number.isFinite(gain) ? gain : 1, context.currentTime, 0.01);
}

export function createChannelGainGraph(
  context: BaseAudioContext,
  source: AudioNode,
  destination: AudioNode,
  gains: readonly number[],
): ChannelGainGraph {
  if (gains.length < 2) return createGainGraph(context, source, destination, gains[0]);
  const splitter = context.createChannelSplitter(gains.length);
  const merger = context.createChannelMerger(gains.length);
  const nodes: AudioNode[] = [splitter];
  source.connect(splitter);
  for (let channel = 0; channel < gains.length; channel += 1) {
    const gain = context.createGain();
    gain.gain.value = Number.isFinite(gains[channel]) ? gains[channel]! : 1;
    splitter.connect(gain, channel);
    gain.connect(merger, 0, channel);
    nodes.push(gain);
  }
  merger.connect(destination);
  nodes.push(merger);
  return nodes;
}

export function setChannelGains(
  graph: ChannelGainGraph,
  context: Pick<BaseAudioContext, 'currentTime'>,
  gains: readonly number[],
): void {
  if (!Array.isArray(graph)) {
    setGain(graph as GainNode, context, gains[0] ?? 1);
    return;
  }
  for (let channel = 0; channel < gains.length; channel += 1) {
    const node = graph[channel + 1];
    if (node && 'gain' in node) setGain(node as GainNode, context, gains[channel] ?? 1);
  }
}

export function applyAudioBufferGains(buffer: AudioBuffer, gains: readonly number[]): void {
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    const gain = gains[channel] ?? 1;
    for (let sample = 0; sample < data.length; sample += 1) data[sample] = data[sample]! * gain;
  }
}

export function measurePeaks(buffer: AudioBuffer): PeakNormalizationStats {
  let maxPeak = 0;
  const peaks: number[] = [];
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    let peak = 0;
    const data = buffer.getChannelData(channel);
    for (let sample = 0; sample < data.length; sample += 1) {
      peak = Math.max(peak, Math.abs(data[sample] ?? 0));
    }
    peaks.push(peak);
    maxPeak = Math.max(maxPeak, peak);
  }
  return { maxPeak, peaks };
}

export function peakNormalizationGains(
  stats: PeakNormalizationStats,
  targetPeak = 1,
  linked = true,
): readonly number[] {
  return stats.peaks.map((channelPeak) => {
    const peak = linked ? stats.maxPeak : channelPeak;
    return peak > 0 ? targetPeak / peak : 1;
  });
}

export function measureRms(buffer: AudioBuffer): RmsNormalizationStats {
  let total = 0;
  let frames = 0;
  let peak = 0;
  const channels: ChannelLevel[] = [];
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    let channelTotal = 0;
    let channelPeak = 0;
    for (const sample of data) {
      channelTotal += sample * sample;
      channelPeak = Math.max(channelPeak, Math.abs(sample));
    }
    channels.push({
      peak: channelPeak,
      rms: Math.sqrt(channelTotal / Math.max(1, data.length)),
    });
    total += channelTotal;
    frames += data.length;
    peak = Math.max(peak, channelPeak);
  }
  return { channels, peak, rms: Math.sqrt(total / Math.max(1, frames)) };
}

export function rmsNormalizationGains(
  stats: RmsNormalizationStats,
  targetDb: number,
  linked = true,
  peakCeiling = 0.99,
): readonly number[] {
  const target = 10 ** (targetDb / 20);
  return stats.channels.map((channel) => {
    const measured = linked ? { peak: stats.peak, rms: stats.rms } : channel;
    let gain = measured.rms > 0 ? target / measured.rms : 1;
    if (measured.peak > 0 && gain * measured.peak > peakCeiling) {
      gain = peakCeiling / measured.peak;
    }
    return gain;
  });
}

export function normalizePlaybackRate(rate: PlaybackRate): PlaybackRate {
  if (typeof rate === 'number') return clampPlaybackRate(rate);
  const points = rate.points
    .map((point) => ({
      position: Math.max(0, Math.min(1, point.position)),
      value: clampPlaybackRate(point.value),
    }))
    .sort((left, right) => left.position - right.position);
  const first = points[0];
  const last = points.at(-1);
  if (!first) return 1;
  if (first.position > 0) points.unshift({ position: 0, value: first.value });
  if (last && last.position < 1) points.push({ position: 1, value: last.value });
  return { points, type: 'profile' };
}

export function playbackRateAt(rate: PlaybackRate, position: number): number {
  const normalized = normalizePlaybackRate(rate);
  if (typeof normalized === 'number') return normalized;
  for (let index = 1; index < normalized.points.length; index += 1) {
    const previous = normalized.points[index - 1];
    const current = normalized.points[index];
    if (previous && current && position <= current.position) {
      const progress = (position - previous.position) / (current.position - previous.position || 1);
      return previous.value + (current.value - previous.value) * progress;
    }
  }
  return normalized.points.at(-1)?.value ?? 1;
}

export function playbackDuration(rate: PlaybackRate, duration: number): number {
  const normalized = normalizePlaybackRate(rate);
  if (typeof normalized === 'number') return duration / normalized;
  let average = 0;
  for (let index = 1; index < normalized.points.length; index += 1) {
    const previous = normalized.points[index - 1];
    const current = normalized.points[index];
    if (previous && current) {
      average += (current.position - previous.position) * ((current.value + previous.value) / 2);
    }
  }
  return duration / Math.max(0.001, average);
}

export function schedulePlaybackRate(
  parameter: AudioParam,
  context: Pick<BaseAudioContext, 'currentTime'>,
  rate: PlaybackRate,
  duration: number,
  seek = 0,
): void {
  const normalized = normalizePlaybackRate(rate);
  const now = context.currentTime;
  parameter.cancelScheduledValues(now);
  if (typeof normalized === 'number') {
    parameter.setValueAtTime(normalized, now);
    return;
  }
  const position = Math.max(0, Math.min(1, seek / Math.max(duration, 0.001)));
  const outputDuration = playbackDuration(normalized, duration);
  parameter.setValueAtTime(playbackRateAt(normalized, position), now);
  for (const point of normalized.points) {
    if (point.position > position) {
      parameter.linearRampToValueAtTime(
        point.value,
        now + (point.position - position) * outputDuration,
      );
    }
  }
}
