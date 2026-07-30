import type { PcmAudio } from '../../types.js';
import type { EffectValues } from '../schema.js';
import { dbToAmplitude, requiredBoolean, requiredNumber } from './values.js';

function compressorGainDb(inputDb: number, threshold: number, knee: number, ratio: number): number {
  const lower = threshold - knee / 2;
  const upper = threshold + knee / 2;
  if (inputDb <= lower) return 0;
  if (knee > 0 && inputDb < upper) {
    const distance = inputDb - lower;
    return (1 / ratio - 1) * ((distance * distance) / (2 * knee));
  }
  return threshold + (inputDb - threshold) / ratio - inputDb;
}

function smoothingCoefficient(seconds: number, sampleRate: number): number {
  return seconds > 0 ? Math.exp(-1 / (seconds * sampleRate)) : 0;
}

export function processCompressor(audio: PcmAudio, values: EffectValues): PcmAudio {
  const threshold = requiredNumber(values, 'threshold');
  const knee = requiredNumber(values, 'knee');
  const ratio = requiredNumber(values, 'ratio');
  const attack = smoothingCoefficient(requiredNumber(values, 'attack'), audio.sampleRate);
  const release = smoothingCoefficient(requiredNumber(values, 'release'), audio.sampleRate);
  const makeup = dbToAmplitude(requiredNumber(values, 'makeup'));
  const output = audio.channels.map((channel) => new Float32Array(channel.length));
  const frameCount = audio.channels[0]?.length ?? 0;
  let smoothedGain = 1;

  for (let frame = 0; frame < frameCount; frame += 1) {
    let peak = 0;
    for (const channel of audio.channels) peak = Math.max(peak, Math.abs(channel[frame] ?? 0));
    const inputDb = peak > 0 ? 20 * Math.log10(peak) : -120;
    const target = dbToAmplitude(compressorGainDb(inputDb, threshold, knee, ratio));
    const coefficient = target < smoothedGain ? attack : release;
    smoothedGain = coefficient * smoothedGain + (1 - coefficient) * target;
    const gain = smoothedGain * makeup;
    for (let channel = 0; channel < output.length; channel += 1) {
      output[channel]![frame] = (audio.channels[channel]![frame] ?? 0) * gain;
    }
  }
  return { channels: output, sampleRate: audio.sampleRate };
}

export function processHardLimiter(audio: PcmAudio, values: EffectValues): PcmAudio {
  const hard = requiredBoolean(values, 'hard');
  const limit = requiredNumber(values, 'limit');
  const ratio = requiredNumber(values, 'ratio');
  const lookAhead = Math.max(
    1,
    Math.round((requiredNumber(values, 'lookAheadMs') * audio.sampleRate) / 1000),
  );
  const frameCount = audio.channels[0]?.length ?? 0;
  const output = audio.channels.map((channel) => channel.slice());

  if (hard) {
    for (const channel of output) {
      for (let frame = 0; frame < channel.length; frame += 1) {
        channel[frame] = Math.max(-limit, Math.min(limit, channel[frame] ?? 0));
      }
    }
    return { channels: output, sampleRate: audio.sampleRate };
  }

  for (let start = 0; start < frameCount; start += lookAhead) {
    const end = Math.min(frameCount, start + lookAhead);
    let peak = 0;
    for (const channel of audio.channels) {
      for (let frame = start; frame < end; frame += 1) {
        peak = Math.max(peak, Math.abs(channel[frame] ?? 0));
      }
    }
    if (peak <= limit) continue;
    const gain = limit / peak;
    for (const channel of output) {
      for (let frame = start; frame < end; frame += 1) {
        const limited = (channel[frame] ?? 0) * gain;
        if (limited === 0) continue;
        const fill = Math.max(0, limit - Math.abs(limited));
        channel[frame] = limited + Math.sign(limited) * fill * ratio;
      }
    }
  }
  return { channels: output, sampleRate: audio.sampleRate };
}
