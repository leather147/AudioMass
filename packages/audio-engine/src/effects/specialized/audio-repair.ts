import type { PcmAudio } from '../../types.js';
import { createBiquadCoefficients, filterBiquad } from '../processors/biquad.js';
import type { AudioRepairWorkflow, RepairSensitivity } from './models.js';

export interface AudioRepairResult {
  audio: PcmAudio;
  detections: number;
  humFrequency: number | null;
}

function hermiteRepair(channel: Float32Array, start: number, end: number): void {
  const x0 = channel[start - 1] ?? 0;
  const x1 = channel[end] ?? 0;
  const m0 = 0.5 * ((channel[start] ?? 0) - (channel[start - 2] ?? 0));
  const m1 = 0.5 * ((channel[end + 1] ?? 0) - (channel[end - 1] ?? 0));
  const span = end - (start - 1);
  for (let frame = start; frame < end; frame += 1) {
    const time = (frame - (start - 1)) / span;
    const squared = time * time;
    const cubed = squared * time;
    const h00 = 2 * cubed - 3 * squared + 1;
    const h10 = cubed - 2 * squared + time;
    const h01 = -2 * cubed + 3 * squared;
    const h11 = cubed - squared;
    channel[frame] = h00 * x0 + h10 * m0 * span + h01 * x1 + h11 * m1 * span;
  }
}

function sensitivityValue<T>(sensitivity: RepairSensitivity, low: T, medium: T, high: T): T {
  return sensitivity === 'low' ? low : sensitivity === 'high' ? high : medium;
}

export function repairSplices(
  channel: Float32Array,
  sampleRate: number,
  sensitivity: RepairSensitivity,
): number {
  const length = channel.length;
  if (length < 512) return 0;
  const thresholdMultiplier = sensitivityValue(sensitivity, 8, 6, 4);
  const absoluteFloor = sensitivityValue(sensitivity, 0.05, 0.025, 0.015);
  const dcFloor = sensitivityValue(sensitivity, 0.04, 0.018, 0.008);
  const dcWindow = Math.max(256, Math.trunc(sampleRate * 0.02));
  const fadeWindow = Math.max(16, Math.trunc(sampleRate * 0.004));
  const halfFade = Math.trunc(fadeWindow / 2);
  const bootstrap = Math.min(2048, length);
  let ema = 0;
  for (let frame = 1; frame < bootstrap; frame += 1) {
    ema += Math.abs((channel[frame] ?? 0) - (channel[frame - 1] ?? 0));
  }
  ema = ema / (bootstrap - 1) || 0.0001;
  ema = Math.max(0.0001, ema);
  const alpha = 1 / 2048;
  let detections = 0;
  let frame = dcWindow + halfFade + 4;
  while (frame < length - dcWindow - halfFade - 4) {
    const difference = (channel[frame] ?? 0) - (channel[frame - 1] ?? 0);
    const absoluteDifference = Math.abs(difference);
    if (absoluteDifference > ema * thresholdMultiplier && absoluteDifference > absoluteFloor) {
      let isolated = true;
      for (let check = 1; check <= 20; check += 1) {
        if (frame + check >= length) break;
        const nearby = (channel[frame + check] ?? 0) - (channel[frame + check - 1] ?? 0);
        if (Math.abs(nearby) > absoluteDifference * 0.5) {
          isolated = false;
          break;
        }
      }
      if (isolated) {
        let previousMean = 0;
        let nextMean = 0;
        let previousEnergy = 0;
        let nextEnergy = 0;
        for (let offset = 1; offset <= dcWindow; offset += 1) {
          const previous = channel[frame - offset] ?? 0;
          const next = channel[frame + offset - 1] ?? 0;
          previousMean += previous;
          nextMean += next;
          previousEnergy += previous * previous;
          nextEnergy += next * next;
        }
        previousMean /= dcWindow;
        nextMean /= dcWindow;
        const dcDifference = nextMean - previousMean;
        const previousVariance = previousEnergy / dcWindow - previousMean * previousMean;
        const nextVariance = nextEnergy / dcWindow - nextMean * nextMean;
        const lowerVariance = Math.min(previousVariance, nextVariance);
        const higherVariance = Math.max(previousVariance, nextVariance);
        const sameDirection =
          (difference > 0 && dcDifference > 0) || (difference < 0 && dcDifference < 0);
        const balanced = lowerVariance > 0.000001 && higherVariance < lowerVariance * 4;
        if (
          sameDirection &&
          balanced &&
          Math.abs(dcDifference) > dcFloor &&
          Math.abs(dcDifference) > absoluteDifference * 0.5
        ) {
          const start = Math.max(2, frame - halfFade);
          const end = Math.min(length - 2, frame + halfFade);
          hermiteRepair(channel, start, end);
          detections += 1;
          frame = end + dcWindow;
          continue;
        }
      }
    }
    ema = Math.max(0.0001, ema * (1 - alpha) + absoluteDifference * alpha);
    frame += 1;
  }
  return detections;
}

export function removeClicks(
  channel: Float32Array,
  sampleRate: number,
  sensitivity: RepairSensitivity,
): number {
  const length = channel.length;
  if (length < 128) return 0;
  const thresholdMultiplier = sensitivityValue(sensitivity, 6, 4, 3);
  const maximumWidth = Math.max(8, Math.trunc(sampleRate * 0.002));
  const absoluteFloor = sensitivityValue(sensitivity, 0.03, 0.015, 0.008);
  const bootstrap = Math.min(2048, length);
  let ema = 0;
  for (let frame = 1; frame < bootstrap; frame += 1) {
    ema += Math.abs((channel[frame] ?? 0) - (channel[frame - 1] ?? 0));
  }
  ema = Math.max(0.0001, ema / (bootstrap - 1) || 0.0001);
  const alpha = 1 / 2048;
  let detections = 0;
  let frame = 4;
  while (frame < length - maximumWidth - 4) {
    const signedDifference = (channel[frame] ?? 0) - (channel[frame - 1] ?? 0);
    const difference = Math.abs(signedDifference);
    if (difference > ema * thresholdMultiplier && difference > absoluteFloor) {
      const threshold = difference * 0.4;
      let end = frame + 1;
      const maximumEnd = frame + maximumWidth;
      let positiveMaximum = signedDifference;
      let negativeMaximum = signedDifference;
      while (
        end < maximumEnd &&
        Math.abs((channel[end] ?? 0) - (channel[end - 1] ?? 0)) > threshold
      ) {
        const nearby = (channel[end] ?? 0) - (channel[end - 1] ?? 0);
        positiveMaximum = Math.max(positiveMaximum, nearby);
        negativeMaximum = Math.min(negativeMaximum, nearby);
        end += 1;
      }
      const width = end - frame;
      if (
        width >= 2 &&
        end < maximumEnd &&
        positiveMaximum > threshold &&
        -negativeMaximum > threshold
      ) {
        const start = Math.max(2, frame - 2);
        const repairEnd = Math.min(length - 2, end + 2);
        hermiteRepair(channel, start, repairEnd);
        detections += 1;
        frame = repairEnd + 4;
        continue;
      }
    }
    ema = Math.max(0.0001, ema * (1 - alpha) + difference * alpha);
    frame += 1;
  }
  return detections;
}

function goertzelMagnitude(
  channel: Float32Array,
  frequency: number,
  sampleRate: number,
  requestedLength: number,
): number {
  const length = Math.min(requestedLength, channel.length);
  const bin = Math.trunc(0.5 + (length * frequency) / sampleRate);
  const omega = (2 * Math.PI * bin) / length;
  const coefficient = 2 * Math.cos(omega);
  let first = 0;
  let second = 0;
  for (let frame = 0; frame < length; frame += 1) {
    const current = (channel[frame] ?? 0) + coefficient * first - second;
    second = first;
    first = current;
  }
  return first * first + second * second - coefficient * first * second;
}

export function detectMainsFrequency(channel: Float32Array, sampleRate: number): number {
  let length = Math.min(channel.length, Math.trunc(sampleRate * 2));
  if (length < 256) length = Math.min(channel.length, 4096);
  if (length < 1) throw new RangeError('The selection is too short for hum detection.');
  const magnitude50 = goertzelMagnitude(channel, 50, sampleRate, length);
  const magnitude60 = goertzelMagnitude(channel, 60, sampleRate, length);
  const center = magnitude60 > magnitude50 ? 60 : 50;
  let best = center;
  let bestMagnitude = 0;
  for (let frequency = center - 1; frequency <= center + 1.0001; frequency += 0.1) {
    const magnitude = goertzelMagnitude(channel, frequency, sampleRate, length);
    if (magnitude > bestMagnitude) {
      bestMagnitude = magnitude;
      best = frequency;
    }
  }
  return best;
}

function removeHum(audio: PcmAudio, frequency: number): { audio: PcmAudio; harmonics: number } {
  let channels: Float32Array[] = audio.channels.map((channel) => channel.slice());
  let harmonics = 0;
  for (let harmonic = 1; harmonic <= 8; harmonic += 1) {
    const harmonicFrequency = frequency * harmonic;
    if (harmonicFrequency >= audio.sampleRate * 0.45) break;
    const coefficients = createBiquadCoefficients({
      frequency: harmonicFrequency,
      q: 12,
      sampleRate: audio.sampleRate,
      type: 'notch',
    });
    channels = channels.map((channel) => filterBiquad(channel, coefficients));
    harmonics += 1;
  }
  return { audio: { channels, sampleRate: audio.sampleRate }, harmonics };
}

export function processAudioRepair(
  audio: PcmAudio,
  workflow: AudioRepairWorkflow,
): AudioRepairResult {
  const frameCount = audio.channels[0]?.length ?? 0;
  if (workflow.mode === 'hum') {
    if (frameCount < 256) throw new RangeError('Select at least 256 frames for hum repair.');
    const humFrequency =
      workflow.mainsFrequency === 'auto'
        ? detectMainsFrequency(audio.channels[0]!, audio.sampleRate)
        : workflow.mainsFrequency;
    const filtered = removeHum(audio, humFrequency);
    return {
      audio: filtered.audio,
      detections: filtered.harmonics,
      humFrequency,
    };
  }
  const minimumFrames = workflow.mode === 'splice' ? 512 : 128;
  if (frameCount < minimumFrames) {
    throw new RangeError(`Select at least ${minimumFrames} frames for ${workflow.mode} repair.`);
  }
  let detections = 0;
  const channels = audio.channels.map((source) => {
    const channel = source.slice();
    detections +=
      workflow.mode === 'splice'
        ? repairSplices(channel, audio.sampleRate, workflow.sensitivity)
        : removeClicks(channel, audio.sampleRate, workflow.sensitivity);
    return channel;
  });
  return {
    audio: { channels, sampleRate: audio.sampleRate },
    detections,
    humFrequency: null,
  };
}
