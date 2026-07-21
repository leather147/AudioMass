(() => {
  type AudioBufferLike = {
    readonly duration: number;
    readonly length: number;
    readonly numberOfChannels: number;
    readonly sampleRate: number;
    getChannelData(channel: number): Float32Array;
  };

  type TempoOptions = {
    maxTempo?: number;
    minTempo?: number;
  };

  type TempoResult = {
    beats: number;
    bpm: number;
    confidence: number;
    duration: number;
    offset: number;
    tempo: number;
  };

  type TempoEstimator = {
    analyze(buffer: AudioBufferLike, options?: TempoOptions): TempoResult;
    estimate(buffer: AudioBufferLike, options?: TempoOptions): Promise<TempoResult>;
  };

  type TempoGlobal = typeof globalThis & {
    AMTempoEstimator?: TempoEstimator;
    PKTempoEstimator?: Pick<TempoEstimator, 'estimate'>;
  };

  type FluxEnvelope = {
    data: Float32Array;
    rate: number;
  };

  type Peak = {
    position: number;
    value: number;
  };

  type IntervalTempo = {
    confidence: number;
    score: number;
    tempo: number;
  };

  function scoreLag(flux: Float32Array, lag: number) {
    let score = 0;
    const length = flux.length - lag;
    if (length <= 0) return 0;
    for (let index = lag; index < flux.length; index += 1) {
      score += (flux[index] ?? 0) * (flux[index - lag] ?? 0);
    }
    return score / length;
  }

  function makeFlux(buffer: AudioBufferLike): FluxEnvelope {
    const sampleRate = buffer.sampleRate;
    const hop = Math.max(256, Math.trunc(sampleRate / 100));
    const frames = Math.max(1, Math.trunc(buffer.length / hop));
    const envelope = new Float32Array(frames);
    const firstChannel = buffer.getChannelData(0);
    const secondChannel =
      buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : undefined;

    for (let frame = 0; frame < frames; frame += 1) {
      const start = frame * hop;
      const end = Math.min(buffer.length, start + hop);
      let sum = 0;
      if (secondChannel) {
        for (let index = start; index < end; index += 1) {
          sum += Math.abs(firstChannel[index] ?? 0) + Math.abs(secondChannel[index] ?? 0);
        }
        envelope[frame] = sum / ((end - start) * 2);
      } else {
        for (let index = start; index < end; index += 1) {
          sum += Math.abs(firstChannel[index] ?? 0);
        }
        envelope[frame] = sum / (end - start);
      }
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
    return { data: flux, rate: sampleRate / hop };
  }

  function foldTempo(tempo: number, minimum: number, maximum: number) {
    while (tempo < minimum) tempo *= 2;
    while (tempo > maximum) tempo /= 2;
    return tempo;
  }

  function pickPeaks(flux: Float32Array, rate: number) {
    const peaks: Peak[] = [];
    const hold = Math.max(1, Math.trunc(rate * 0.08));
    let last = -hold;

    for (let index = 1; index < flux.length - 1; index += 1) {
      if (index - last < hold) continue;
      const value = flux[index] ?? 0;
      if (value <= (flux[index - 1] ?? 0) || value < (flux[index + 1] ?? 0) || value <= 0) {
        continue;
      }
      peaks.push({ position: index, value });
      last = index;
    }

    peaks.sort((left, right) => right.value - left.value);
    if (peaks.length > 320) peaks.length = 320;
    peaks.sort((left, right) => left.position - right.position);
    return peaks;
  }

  function intervalTempo(
    flux: Float32Array,
    rate: number,
    minimum: number,
    maximum: number,
  ): IntervalTempo {
    const peaks = pickPeaks(flux, rate);
    const bins = new Map<number, number>();
    let bestTempo = 0;
    let bestScore = 0;
    let secondScore = 0;

    for (let first = 0; first < peaks.length; first += 1) {
      for (let second = first + 1; second < peaks.length && second < first + 16; second += 1) {
        const firstPeak = peaks[first]!;
        const secondPeak = peaks[second]!;
        const distance = (secondPeak.position - firstPeak.position) / rate;
        if (distance <= 0) continue;
        const tempo = foldTempo(60 / distance, minimum, maximum);
        const key = Math.round(tempo);
        const score = (firstPeak.value + secondPeak.value) / (second - first);
        bins.set(key, (bins.get(key) ?? 0) + score);
      }
    }

    for (const [tempo, score] of bins) {
      if (score > bestScore) {
        secondScore = bestScore;
        bestScore = score;
        bestTempo = tempo;
      } else if (score > secondScore) {
        secondScore = score;
      }
    }

    return {
      confidence: bestScore ? (bestScore - secondScore) / bestScore : 0,
      score: bestScore,
      tempo: bestTempo,
    };
  }

  function analyze(buffer: AudioBufferLike, options: TempoOptions = {}): TempoResult {
    if (!buffer?.length || buffer.duration < 2) {
      throw new Error('Audio is too short to estimate tempo.');
    }

    const minimum = options.minTempo || 60;
    const maximum = options.maxTempo || 200;
    const envelope = makeFlux(buffer);
    const { data: flux, rate } = envelope;
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
      } else if (score > secondScore) {
        secondScore = score;
      }
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
    const phaseLength = Math.min(bestLag, flux.length);
    for (let candidate = 0; candidate < phaseLength; candidate += 1) {
      let score = 0;
      for (let index = candidate; index < flux.length; index += bestLag) {
        score += flux[index] ?? 0;
      }
      if (score > phaseScore) {
        phaseScore = score;
        phase = candidate;
      }
    }

    const period = bestLag / rate;
    const offset = phase / rate;
    const beats = Math.max(0, Math.floor((buffer.duration - offset) / period));
    let confidence = Math.max((bestScore - secondScore) / bestScore, interval.confidence || 0);
    confidence = Math.max(0, Math.min(100, confidence * 100));

    return {
      beats,
      bpm: Math.round(tempo),
      confidence: Math.round(confidence),
      duration: Math.round(buffer.duration * 10) / 10,
      offset: Math.round(offset * 1_000) / 1_000,
      tempo: Math.round(tempo * 10) / 10,
    };
  }

  function estimate(buffer: AudioBufferLike, options?: TempoOptions) {
    return new Promise<TempoResult>((resolve, reject) => {
      globalThis.setTimeout(() => {
        try {
          resolve(analyze(buffer, options));
        } catch (error) {
          reject(error);
        }
      }, 20);
    });
  }

  const service: TempoEstimator = { analyze, estimate };
  const runtime = globalThis as TempoGlobal;
  runtime.AMTempoEstimator = service;
  runtime.PKTempoEstimator = { estimate };
})();
