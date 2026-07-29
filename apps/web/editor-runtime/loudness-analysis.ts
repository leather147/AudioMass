(() => {
  type AudioBufferLike = {
    readonly length: number;
    readonly numberOfChannels: number;
    readonly sampleRate: number;
    getChannelData(channel: number): Float32Array;
  };

  type BiquadCoefficients = {
    a1: number;
    a2: number;
    b0: number;
    b1: number;
    b2: number;
  };

  type BiquadState = {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };

  type LoudnessReport = {
    blocks: number;
    lufs: number;
    peak: number;
    peakDb: number;
    rms: number;
    rmsDb: number;
    truePeak: number;
    truePeakDb: number;
  };

  type LoudnessNormalization = {
    expectedLUFS: number;
    expectedTruePeakDb: number;
    gain: number;
    gainDb: number;
    limited: boolean;
  };

  type LoudnessAnalysis = {
    BS1770Block: typeof CONSTANTS;
    analyze(buffer: AudioBufferLike): LoudnessReport;
    db(value: number): number;
    gainForTarget(report: LoudnessReport, target: unknown, ceiling: unknown): LoudnessNormalization;
    integratedLUFS(buffer: AudioBufferLike): number;
    kWeightCoeffs(rate: number): [BiquadCoefficients, BiquadCoefficients];
  };

  type LoudnessWindow = Window & {
    AMLoudnessAnalysis?: LoudnessAnalysis;
    PKAudioEditor?: {
      _deps: { lufs?: LoudnessAnalysis };
    };
  };

  const CONSTANTS = {
    absGate: -70,
    block: 0.4,
    hop: 0.1,
    offset: -0.691,
    relGate: -10,
    truePeakSteps: 4,
  } as const;

  function db(value: number) {
    return value > 0 ? 20 * Math.log10(value) : -120;
  }

  function loudness(value: number) {
    return value > 0 ? CONSTANTS.offset + 10 * Math.log10(value) : Number.NEGATIVE_INFINITY;
  }

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

  function highShelf(rate: number) {
    const frequency = Math.min(1681.974450955533, rate * 0.45);
    const quality = 0.7071752369554196;
    const gain = 3.999843853973347;
    const amplitude = 10 ** (gain / 40);
    const angularFrequency = (2 * Math.PI * frequency) / rate;
    const sine = Math.sin(angularFrequency);
    const cosine = Math.cos(angularFrequency);
    const alpha = sine / (2 * quality);
    const amplitudeRoot = Math.sqrt(amplitude);

    return normalizeCoefficients(
      amplitude * (amplitude + 1 + (amplitude - 1) * cosine + 2 * amplitudeRoot * alpha),
      -2 * amplitude * (amplitude - 1 + (amplitude + 1) * cosine),
      amplitude * (amplitude + 1 + (amplitude - 1) * cosine - 2 * amplitudeRoot * alpha),
      amplitude + 1 - (amplitude - 1) * cosine + 2 * amplitudeRoot * alpha,
      2 * (amplitude - 1 - (amplitude + 1) * cosine),
      amplitude + 1 - (amplitude - 1) * cosine - 2 * amplitudeRoot * alpha,
    );
  }

  function highPass(rate: number) {
    const frequency = Math.min(38.13547087602444, rate * 0.45);
    const quality = 0.5003270373238773;
    const angularFrequency = (2 * Math.PI * frequency) / rate;
    const sine = Math.sin(angularFrequency);
    const cosine = Math.cos(angularFrequency);
    const alpha = sine / (2 * quality);

    return normalizeCoefficients(
      (1 + cosine) / 2,
      -(1 + cosine),
      (1 + cosine) / 2,
      1 + alpha,
      -2 * cosine,
      1 - alpha,
    );
  }

  function kWeightCoeffs(rate: number): [BiquadCoefficients, BiquadCoefficients] {
    return [highShelf(rate), highPass(rate)];
  }

  function biquad(input: number, coefficients: BiquadCoefficients, state: BiquadState) {
    const output =
      coefficients.b0 * input +
      coefficients.b1 * state.x1 +
      coefficients.b2 * state.x2 -
      coefficients.a1 * state.y1 -
      coefficients.a2 * state.y2;
    state.x2 = state.x1;
    state.x1 = input;
    state.y2 = state.y1;
    state.y1 = output;
    return output;
  }

  function interpolate(a: number, b: number, c: number, d: number, progress: number) {
    const squared = progress * progress;
    return (
      0.5 *
      (2 * b +
        (-a + c) * progress +
        (2 * a - 5 * b + 4 * c - d) * squared +
        (-a + 3 * b - 3 * c + d) * squared * progress)
    );
  }

  function analyze(buffer: AudioBufferLike): LoudnessReport {
    const { length, numberOfChannels, sampleRate } = buffer;
    let hop = Math.max(1, Math.trunc(sampleRate * CONSTANTS.hop));
    let block = Math.max(1, hop * 4);
    if (length < block) {
      block = length;
      hop = length || 1;
    }

    const blocks = length <= block ? 1 : Math.trunc((length - block) / hop) + 1;
    const sums = new Float64Array(blocks);
    const coefficients = kWeightCoeffs(sampleRate);
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
          if (blockIndex < blocks) {
            indexes[slot] = blockIndex;
            accumulators[slot] = 0;
          }
          blockIndex += 1;
          next += hop;
        }

        const sample = data[index] ?? 0;
        let absolute = Math.abs(sample);
        const filtered = biquad(
          biquad(sample, coefficients[0], shelfState),
          coefficients[1],
          passState,
        );
        const squared = filtered * filtered;

        total += sample * sample;
        peak = Math.max(peak, absolute);
        truePeak = Math.max(truePeak, absolute);

        if (index < length - 1) {
          const previous = index ? (data[index - 1] ?? sample) : sample;
          const nextSample = data[index + 1] ?? sample;
          const following = index < length - 2 ? (data[index + 2] ?? nextSample) : nextSample;
          for (let step = 1; step < CONSTANTS.truePeakSteps; step += 1) {
            absolute = Math.abs(
              interpolate(previous, sample, nextSample, following, step / CONSTANTS.truePeakSteps),
            );
            truePeak = Math.max(truePeak, absolute);
          }
        }

        for (let slot = 0; slot < slots; slot += 1) {
          if ((indexes[slot] ?? -1) >= 0) {
            accumulators[slot] = (accumulators[slot] ?? 0) + squared;
          }
        }
      }

      for (let slot = 0; slot < slots; slot += 1) flush(slot);
    }

    const energies: number[] = [];
    let energySum = 0;
    for (let index = 0; index < blocks; index += 1) {
      const energy = (sums[index] ?? 0) / block;
      if (loudness(energy) >= CONSTANTS.absGate) {
        energies.push(energy);
        energySum += energy;
      }
    }

    let lufs = Number.NEGATIVE_INFINITY;
    if (energies.length) {
      const gate = loudness(energySum / energies.length) + CONSTANTS.relGate;
      energySum = 0;
      let count = 0;
      for (const energy of energies) {
        if (loudness(energy) >= gate) {
          energySum += energy;
          count += 1;
        }
      }
      if (count) lufs = loudness(energySum / count);
    }

    const rms = Math.sqrt(total / Math.max(1, length * numberOfChannels));
    return {
      blocks,
      lufs,
      peak,
      peakDb: db(peak),
      rms,
      rmsDb: db(rms),
      truePeak,
      truePeakDb: db(truePeak),
    };
  }

  function integratedLUFS(buffer: AudioBufferLike) {
    return analyze(buffer).lufs;
  }

  function gainForTarget(
    report: LoudnessReport,
    target: unknown,
    ceiling: unknown,
  ): LoudnessNormalization {
    const normalizedTarget = Number(target);
    const requestedCeiling = Number(ceiling);
    const normalizedCeiling = Number.isFinite(requestedCeiling) ? requestedCeiling : -1;
    let gainDb = Number.isFinite(report.lufs) ? normalizedTarget - report.lufs : 0;
    const maximumGain = normalizedCeiling - report.truePeakDb;
    let limited = false;

    if (gainDb > maximumGain) {
      gainDb = maximumGain;
      limited = true;
    }

    return {
      expectedLUFS: Number.isFinite(report.lufs) ? report.lufs + gainDb : report.lufs,
      expectedTruePeakDb: report.truePeakDb + gainDb,
      gain: 10 ** (gainDb / 20),
      gainDb,
      limited,
    };
  }

  const service: LoudnessAnalysis = {
    BS1770Block: CONSTANTS,
    analyze,
    db,
    gainForTarget,
    integratedLUFS,
    kWeightCoeffs,
  };
  const runtimeWindow = window as LoudnessWindow;
  runtimeWindow.AMLoudnessAnalysis = service;
  if (runtimeWindow.PKAudioEditor?._deps) runtimeWindow.PKAudioEditor._deps.lufs = service;
})();
