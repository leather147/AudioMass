(() => {
  type ChannelStats = { peak: number; rms: number };
  type PeakStats = { buffer: AudioBuffer; maxPeak: number; peaks: number[] };
  type RmsStats = {
    buffer: AudioBuffer;
    chans: ChannelStats[];
    peak: number;
    rms: number;
  };
  type RatePoint = { val: number; x: number };
  type RateProfilePoint = { time?: unknown; val?: unknown; x?: unknown };
  type RateProfile = { points?: ArrayLike<RateProfilePoint>; type?: unknown };
  type ChannelGainFilter = GainNode | AudioNode[];

  type AudioEffectUtilities = {
    applyBufferGains(buffer: AudioBuffer, gains: ArrayLike<number>): void;
    channelGainFilter(
      audioContext: BaseAudioContext,
      destination: AudioNode,
      source: AudioNode,
      gains?: ArrayLike<number>,
    ): ChannelGainFilter;
    clampRate(value: unknown): number;
    fadeCurve(fadeGain: (value: number) => number, reverse?: boolean): Float32Array;
    gainFilter(
      audioContext: BaseAudioContext,
      destination: AudioNode,
      source: AudioNode,
      gain: unknown,
    ): GainNode;
    peakNormalizeGains(stats: PeakStats, value: ArrayLike<unknown>): number[];
    peakNormalizeStats(buffer: AudioBuffer): PeakStats;
    rateAt(points: RatePoint[], position: number): number;
    rateDuration(value: unknown, duration: number): number;
    ratePoints(value: unknown, duration: number): RatePoint[] | null;
    rmsNormalizeGains(stats: RmsStats, value: ArrayLike<unknown>): number[];
    rmsNormalizeStats(buffer: AudioBuffer): RmsStats;
    setChannelGains(
      filter: ChannelGainFilter | undefined,
      audioContext: BaseAudioContext,
      gains?: ArrayLike<number>,
    ): void;
    setGainValue(node: GainNode | undefined, audioContext: BaseAudioContext, gain: unknown): void;
    setRate(
      parameter: AudioParam,
      audioContext: Pick<BaseAudioContext, 'currentTime'> | null,
      value: unknown,
      duration: number,
      seek?: number,
    ): void;
  };

  type EffectUtilitiesWindow = Window & {
    AMAudioEffectUtilities?: AudioEffectUtilities;
  };

  function finiteGain(value: unknown) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 1;
  }

  function fadeCurve(fadeGain: (value: number) => number, reverse = false) {
    const curve = new Float32Array(32);
    for (let index = curve.length - 1; index >= 0; index -= 1) {
      const progress = index / (curve.length - 1);
      curve[index] = fadeGain(reverse ? 1 - progress : progress);
    }
    return curve;
  }

  function gainFilter(
    audioContext: BaseAudioContext,
    destination: AudioNode,
    source: AudioNode,
    gain: unknown,
  ) {
    const node = audioContext.createGain();
    node.gain.value = finiteGain(gain);
    source.connect(node);
    node.connect(destination);
    return node;
  }

  function setGainValue(node: GainNode | undefined, audioContext: BaseAudioContext, gain: unknown) {
    if (!node?.gain) return;
    node.gain.cancelScheduledValues(audioContext.currentTime);
    node.gain.setTargetAtTime(finiteGain(gain), audioContext.currentTime, 0.01);
  }

  function channelGainFilter(
    audioContext: BaseAudioContext,
    destination: AudioNode,
    source: AudioNode,
    gains?: ArrayLike<number>,
  ): ChannelGainFilter {
    if (!gains || gains.length < 2) {
      return gainFilter(audioContext, destination, source, gains?.[0]);
    }

    const splitter = audioContext.createChannelSplitter(gains.length);
    const merger = audioContext.createChannelMerger(gains.length);
    const nodes: AudioNode[] = [splitter];
    source.connect(splitter);

    for (let channel = 0; channel < gains.length; channel += 1) {
      const gain = audioContext.createGain();
      gain.gain.value = finiteGain(gains[channel]);
      splitter.connect(gain, channel);
      gain.connect(merger, 0, channel);
      nodes.push(gain);
    }

    merger.connect(destination);
    nodes.push(merger);
    return nodes;
  }

  function setChannelGains(
    filter: ChannelGainFilter | undefined,
    audioContext: BaseAudioContext,
    gains?: ArrayLike<number>,
  ) {
    if (!filter || !gains) return;
    if (!Array.isArray(filter)) {
      setGainValue(filter, audioContext, gains[0]);
      return;
    }

    for (let channel = 0; channel < gains.length; channel += 1) {
      setGainValue(filter[channel + 1] as GainNode | undefined, audioContext, gains[channel]);
    }
  }

  function applyBufferGains(buffer: AudioBuffer, gains: ArrayLike<number>) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const channelData = buffer.getChannelData(channel);
      const gain = gains[channel] || 1;
      for (let sample = 0; sample < channelData.length; sample += 1) {
        channelData[sample] = channelData[sample]! * gain;
      }
    }
  }

  function peakNormalizeStats(buffer: AudioBuffer): PeakStats {
    let maxPeak = 0;
    const peaks: number[] = [];

    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const channelData = buffer.getChannelData(channel);
      let peak = 0;
      for (let sample = 1; sample < channelData.length; sample += 10) {
        peak = Math.max(peak, Math.abs(channelData[sample]!));
      }
      peaks[channel] = peak;
      maxPeak = Math.max(maxPeak, peak);
    }

    return { buffer, maxPeak, peaks };
  }

  function peakNormalizeGains(stats: PeakStats, value: ArrayLike<unknown>) {
    const maximum = Number(value[1]) || 1;
    return stats.peaks.map((channelPeak) => {
      const peak = value[0] ? stats.maxPeak : channelPeak;
      return peak > 0 ? maximum / peak : 1;
    });
  }

  function rmsNormalizeStats(buffer: AudioBuffer): RmsStats {
    let globalSum = 0;
    let globalPeak = 0;
    let globalLength = 0;
    const chans: ChannelStats[] = [];

    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const channelData = buffer.getChannelData(channel);
      let sum = 0;
      let peak = 0;
      for (let sample = 0; sample < channelData.length; sample += 1) {
        const current = channelData[sample]!;
        sum += current * current;
        peak = Math.max(peak, Math.abs(current));
      }
      chans[channel] = {
        peak,
        rms: Math.sqrt(sum / Math.max(1, channelData.length)),
      };
      globalSum += sum;
      globalPeak = Math.max(globalPeak, peak);
      globalLength += channelData.length;
    }

    return {
      buffer,
      chans,
      peak: globalPeak,
      rms: Math.sqrt(globalSum / Math.max(1, globalLength)),
    };
  }

  function rmsNormalizeGains(stats: RmsStats, value: ArrayLike<unknown>) {
    const target = 10 ** (Number(value[1]) / 20);
    const peakCeiling = 0.99;
    return stats.chans.map((channelStats) => {
      const channel = value[0] ? { peak: stats.peak, rms: stats.rms } : channelStats;
      let gain = channel.rms > 0 ? target / channel.rms : 1;
      if (channel.peak > 0 && gain * channel.peak > peakCeiling) {
        gain = peakCeiling / channel.peak;
      }
      return gain;
    });
  }

  function clampRate(value: unknown) {
    const rate = Number(value);
    return Math.max(0.05, Math.min(4, Number.isNaN(rate) ? 1 : rate));
  }

  function ratePoints(value: unknown, duration: number): RatePoint[] | null {
    if (!value || typeof value !== 'object') return null;
    const profile = value as RateProfile;
    if (profile.type !== 'profile' || !profile.points?.length) return null;

    const points: RatePoint[] = [];
    for (let index = 0; index < profile.points.length; index += 1) {
      const source = profile.points[index] ?? {};
      let position = source.x;
      if (position === undefined && duration > 0) position = Number(source.time) / duration;
      let numericPosition = Number(position);
      if (Number.isNaN(numericPosition)) {
        numericPosition = index / Math.max(1, profile.points.length - 1);
      }
      points.push({
        val: clampRate(source.val),
        x: Math.max(0, Math.min(1, numericPosition)),
      });
    }

    points.sort((left, right) => (left.x > right.x ? 1 : -1));
    const first = points[0];
    const last = points.at(-1);
    if (first && first.x > 0) points.unshift({ val: first.val, x: 0 });
    if (last && last.x < 1) points.push({ val: last.val, x: 1 });
    return points;
  }

  function rateDuration(value: unknown, duration: number) {
    const points = ratePoints(value, duration);
    if (!points) return duration / clampRate(value);

    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      if (!previous || !current) continue;
      total += (current.x - previous.x) * ((current.val + previous.val) / 2);
    }
    return duration / (total > 0.001 ? total : 1);
  }

  function rateAt(points: RatePoint[], position: number) {
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      if (previous && current && position <= current.x) {
        const progress = (position - previous.x) / (current.x - previous.x || 1);
        return previous.val + (current.val - previous.val) * progress;
      }
    }
    return points.at(-1)?.val ?? 1;
  }

  function setRate(
    parameter: AudioParam,
    audioContext: Pick<BaseAudioContext, 'currentTime'> | null,
    value: unknown,
    duration: number,
    seek = 0,
  ) {
    const now = audioContext?.currentTime ?? 0;
    const points = ratePoints(value, duration);
    parameter.cancelScheduledValues?.(now);
    if (!points) {
      parameter.setValueAtTime(clampRate(value), now);
      return;
    }

    const position = Math.max(0, Math.min(1, seek / duration));
    const outputDuration = rateDuration(value, duration);
    parameter.setValueAtTime(rateAt(points, position), now);
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      if (point && point.x > position) {
        parameter.linearRampToValueAtTime(point.val, now + (point.x - position) * outputDuration);
      }
    }
  }

  (window as EffectUtilitiesWindow).AMAudioEffectUtilities = {
    applyBufferGains,
    channelGainFilter,
    clampRate,
    fadeCurve,
    gainFilter,
    peakNormalizeGains,
    peakNormalizeStats,
    rateAt,
    rateDuration,
    ratePoints,
    rmsNormalizeGains,
    rmsNormalizeStats,
    setChannelGains,
    setGainValue,
    setRate,
  };
})();
