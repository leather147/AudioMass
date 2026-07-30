import type { PcmAudio } from '../../types.js';
import type { EffectValues } from '../schema.js';
import { compatibilityMixGains, requiredNumber } from './values.js';

export function processDelay(audio: PcmAudio, values: EffectValues): PcmAudio {
  const delaySeconds = requiredNumber(values, 'delaySeconds');
  const feedback = requiredNumber(values, 'feedback');
  const mix = compatibilityMixGains(requiredNumber(values, 'mix'));
  const delayFrames = Math.round(delaySeconds * audio.sampleRate);
  if (delayFrames < 1) {
    return {
      channels: audio.channels.map((channel) =>
        Float32Array.from(channel, (sample) => sample * (mix.dry + mix.wet)),
      ),
      sampleRate: audio.sampleRate,
    };
  }
  return {
    channels: audio.channels.map((channel) => {
      const echo = new Float32Array(channel.length);
      const output = new Float32Array(channel.length);
      for (let frame = 0; frame < channel.length; frame += 1) {
        const delayedFrame = frame - delayFrames;
        const delayed =
          delayedFrame >= 0
            ? (channel[delayedFrame] ?? 0) + (echo[delayedFrame] ?? 0) * feedback
            : 0;
        echo[frame] = delayed;
        output[frame] = (channel[frame] ?? 0) * mix.dry + delayed * mix.wet;
      }
      return output;
    }),
    sampleRate: audio.sampleRate,
  };
}

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function impulseTaps(length: number, decay: number, channel: number): Array<[number, number]> {
  const count = Math.min(64, length);
  if (count < 1) return [];
  const next = random(0x9e37_79b9 ^ (channel * 0x85eb_ca6b) ^ length);
  const taps: Array<[number, number]> = [];
  let energy = 0;
  for (let index = 0; index < count; index += 1) {
    const frame = count === 1 ? 0 : Math.round((index * (length - 1)) / (count - 1));
    const envelope = Math.pow(1 - frame / Math.max(1, length), decay);
    const value = (next() * 2 - 1) * envelope;
    energy += value * value;
    taps.push([frame, value]);
  }
  const normalization = energy > 0 ? 1 / Math.sqrt(energy) : 1;
  return taps.map(([frame, value]) => [frame, value * normalization]);
}

export function processReverb(audio: PcmAudio, values: EffectValues): PcmAudio {
  const length = Math.round(requiredNumber(values, 'timeSeconds') * audio.sampleRate);
  const decay = requiredNumber(values, 'decay');
  const mix = compatibilityMixGains(requiredNumber(values, 'mix'));
  return {
    channels: audio.channels.map((channel, channelIndex) => {
      const taps = impulseTaps(length, decay, channelIndex);
      const output = new Float32Array(channel.length);
      for (let frame = 0; frame < channel.length; frame += 1) {
        let wet = 0;
        for (const [delay, gain] of taps) {
          if (delay > frame) break;
          wet += (channel[frame - delay] ?? 0) * gain;
        }
        output[frame] = (channel[frame] ?? 0) * mix.dry + wet * mix.wet;
      }
      return output;
    }),
    sampleRate: audio.sampleRate,
  };
}
