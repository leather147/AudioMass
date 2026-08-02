import { assertValidPcm } from '../dsp/pcm.js';
import type { PcmAudio } from '../types.js';

export type WavBitDepth = 16 | 24 | 32;
export type WavSamples = Float32Array | Int16Array | Int32Array;

export interface WavEncodingOptions {
  bitDepth: WavBitDepth;
  channels: number;
  sampleRate: number;
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function interleaveWavChannels(channels: readonly WavSamples[]): WavSamples {
  const first = channels[0];
  if (!first || channels.length === 0) throw new Error('WAV encoding requires a channel.');
  if (
    channels.some(
      (channel) => channel.constructor !== first.constructor || channel.length !== first.length,
    )
  ) {
    throw new Error('WAV channels must use the same sample format and length.');
  }
  const length = first.length * channels.length;
  const output =
    first instanceof Float32Array
      ? new Float32Array(length)
      : first instanceof Int32Array
        ? new Int32Array(length)
        : new Int16Array(length);
  for (let frame = 0; frame < first.length; frame += 1) {
    for (let channel = 0; channel < channels.length; channel += 1) {
      output[frame * channels.length + channel] = channels[channel]?.[frame] ?? 0;
    }
  }
  return output;
}

export function encodeWav(samples: WavSamples, options: WavEncodingOptions): ArrayBuffer {
  const { bitDepth, channels, sampleRate } = options;
  if (!Number.isInteger(channels) || channels < 1) throw new Error('Invalid WAV channel count.');
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('Invalid WAV sample rate.');
  const bytesPerSample = bitDepth / 8;
  const dataLength = samples.length * bytesPerSample;
  const float = bitDepth === 32;
  const formatSize = float ? 18 : 16;
  const factSize = float ? 12 : 0;
  const totalSize = 12 + 8 + formatSize + factSize + 8 + dataLength;
  const output = new ArrayBuffer(totalSize);
  const view = new DataView(output);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeAscii(view, 8, 'WAVE');

  let offset = 12;
  writeAscii(view, offset, 'fmt ');
  view.setUint32(offset + 4, formatSize, true);
  view.setUint16(offset + 8, float ? 3 : 1, true);
  view.setUint16(offset + 10, channels, true);
  view.setUint32(offset + 12, sampleRate, true);
  view.setUint32(offset + 16, sampleRate * channels * bytesPerSample, true);
  view.setUint16(offset + 20, channels * bytesPerSample, true);
  view.setUint16(offset + 22, bitDepth, true);
  if (float) view.setUint16(offset + 24, 0, true);
  offset += 8 + formatSize;

  if (float) {
    writeAscii(view, offset, 'fact');
    view.setUint32(offset + 4, 4, true);
    view.setUint32(offset + 8, samples.length / channels, true);
    offset += 12;
  }

  writeAscii(view, offset, 'data');
  view.setUint32(offset + 4, dataLength, true);
  offset += 8;

  for (const sample of samples) {
    if (bitDepth === 16) {
      view.setInt16(offset, sample, true);
      offset += 2;
    } else if (bitDepth === 24) {
      view.setUint8(offset, sample & 0xff);
      view.setUint8(offset + 1, (sample >> 8) & 0xff);
      view.setUint8(offset + 2, (sample >> 16) & 0xff);
      offset += 3;
    } else {
      view.setFloat32(offset, sample, true);
      offset += 4;
    }
  }
  return output;
}

function quantizeChannel(channel: Float32Array, bitDepth: WavBitDepth): WavSamples {
  if (bitDepth === 32) return channel.slice();
  if (bitDepth === 24) {
    return Int32Array.from(channel, (sample) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      return Math.round(clamped < 0 ? clamped * 0x800000 : clamped * 0x7fffff);
    });
  }
  return Int16Array.from(channel, (sample) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    return Math.round(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff);
  });
}

export function encodePcmAsWav(audio: PcmAudio, bitDepth: WavBitDepth = 16): ArrayBuffer {
  assertValidPcm(audio);
  const samples = interleaveWavChannels(
    audio.channels.map((channel) => quantizeChannel(channel, bitDepth)),
  );
  return encodeWav(samples, {
    bitDepth,
    channels: audio.channels.length,
    sampleRate: audio.sampleRate,
  });
}
