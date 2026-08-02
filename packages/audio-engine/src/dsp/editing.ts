import { AudioEngineError } from '../errors.js';
import type { PcmAudio } from '../types.js';
import { assertValidPcm, pcmDuration } from './pcm.js';

export interface PcmTimeRange {
  end: number;
  start: number;
}

function frameRange(audio: PcmAudio, range: PcmTimeRange): [number, number] {
  const duration = pcmDuration(audio);
  const start = Math.max(0, Math.min(duration, Math.min(range.start, range.end)));
  const end = Math.max(start, Math.min(duration, Math.max(range.start, range.end)));
  return [Math.floor(start * audio.sampleRate), Math.ceil(end * audio.sampleRate)];
}

function assertCompatible(left: PcmAudio, right: PcmAudio): void {
  assertValidPcm(left);
  assertValidPcm(right);
  if (left.sampleRate !== right.sampleRate) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'PCM sample rates must match.');
  }
  if (right.channels.length !== 1 && right.channels.length !== left.channels.length) {
    throw new AudioEngineError(
      'INVALID_AUDIO_DATA',
      'Inserted PCM must be mono or match the destination channel count.',
    );
  }
}

export function createSilence(channelCount: number, frames: number, sampleRate: number): PcmAudio {
  if (
    !Number.isInteger(channelCount) ||
    channelCount < 1 ||
    !Number.isInteger(frames) ||
    frames < 0
  ) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'Silence dimensions are invalid.');
  }
  return {
    channels: Array.from({ length: channelCount }, () => new Float32Array(frames)),
    sampleRate,
  };
}

export function extractPcmRange(audio: PcmAudio, range: PcmTimeRange): PcmAudio {
  assertValidPcm(audio);
  const [start, end] = frameRange(audio, range);
  return {
    channels: audio.channels.map((channel) => channel.slice(start, end)),
    sampleRate: audio.sampleRate,
  };
}

export function removePcmRange(audio: PcmAudio, range: PcmTimeRange): PcmAudio {
  assertValidPcm(audio);
  const [start, end] = frameRange(audio, range);
  const length = (audio.channels[0]?.length ?? 0) - (end - start);
  return {
    channels: audio.channels.map((channel) => {
      const output = new Float32Array(length);
      output.set(channel.subarray(0, start));
      output.set(channel.subarray(end), start);
      return output;
    }),
    sampleRate: audio.sampleRate,
  };
}

export function insertPcm(audio: PcmAudio, atSeconds: number, inserted: PcmAudio): PcmAudio {
  assertCompatible(audio, inserted);
  const frameCount = audio.channels[0]?.length ?? 0;
  const insertedFrames = inserted.channels[0]?.length ?? 0;
  const offset = Math.max(0, Math.min(frameCount, Math.floor(atSeconds * audio.sampleRate)));
  return {
    channels: audio.channels.map((channel, index) => {
      const addition = inserted.channels[inserted.channels.length === 1 ? 0 : index]!;
      const output = new Float32Array(frameCount + insertedFrames);
      output.set(channel.subarray(0, offset));
      output.set(addition, offset);
      output.set(channel.subarray(offset), offset + insertedFrames);
      return output;
    }),
    sampleRate: audio.sampleRate,
  };
}

export function overwritePcmRange(
  audio: PcmAudio,
  range: PcmTimeRange,
  inserted: PcmAudio,
): PcmAudio {
  const [start] = frameRange(audio, range);
  return insertPcm(removePcmRange(audio, range), start / audio.sampleRate, inserted);
}

export function replacePcmAt(audio: PcmAudio, atSeconds: number, inserted: PcmAudio): PcmAudio {
  assertCompatible(audio, inserted);
  const frameCount = audio.channels[0]?.length ?? 0;
  const insertedFrames = inserted.channels[0]?.length ?? 0;
  const offset = Math.max(0, Math.floor(atSeconds * audio.sampleRate));
  const outputFrames = Math.max(frameCount, offset + insertedFrames);
  return {
    channels: audio.channels.map((channel, index) => {
      const addition = inserted.channels[inserted.channels.length === 1 ? 0 : index]!;
      const output = new Float32Array(outputFrames);
      output.set(channel);
      output.set(addition, offset);
      return output;
    }),
    sampleRate: audio.sampleRate,
  };
}
