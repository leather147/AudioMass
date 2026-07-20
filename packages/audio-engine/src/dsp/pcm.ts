import { AudioEngineError } from '../errors.js';
import type { PcmAudio } from '../types.js';

export function assertValidPcm(audio: PcmAudio): void {
  if (!Number.isFinite(audio.sampleRate) || audio.sampleRate <= 0 || audio.channels.length === 0) {
    throw new AudioEngineError(
      'INVALID_AUDIO_DATA',
      'PCM audio requires channels and a sample rate.',
    );
  }
  const length = audio.channels[0]?.length;
  if (length === undefined || audio.channels.some((channel) => channel.length !== length)) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'All PCM channels must have the same length.');
  }
}

export function clonePcm(audio: PcmAudio): PcmAudio {
  assertValidPcm(audio);
  return {
    channels: audio.channels.map((channel) => channel.slice()),
    sampleRate: audio.sampleRate,
  };
}

export function pcmDuration(audio: PcmAudio): number {
  assertValidPcm(audio);
  return (audio.channels[0]?.length ?? 0) / audio.sampleRate;
}

export function applyGain(audio: PcmAudio, gain: number): PcmAudio {
  assertValidPcm(audio);
  if (!Number.isFinite(gain)) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'Gain must be a finite number.');
  }
  return {
    channels: audio.channels.map((channel) =>
      Float32Array.from(channel, (sample) => sample * gain),
    ),
    sampleRate: audio.sampleRate,
  };
}

export function normalize(audio: PcmAudio, targetPeak = 0.99): PcmAudio {
  assertValidPcm(audio);
  if (!(targetPeak > 0 && targetPeak <= 1)) {
    throw new AudioEngineError('INVALID_AUDIO_DATA', 'Target peak must be within (0, 1].');
  }
  let peak = 0;
  for (const channel of audio.channels) {
    for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  }
  return peak === 0 ? clonePcm(audio) : applyGain(audio, targetPeak / peak);
}

export function reverse(audio: PcmAudio): PcmAudio {
  assertValidPcm(audio);
  return {
    channels: audio.channels.map((channel) => channel.slice().reverse()),
    sampleRate: audio.sampleRate,
  };
}

export function trim(audio: PcmAudio, startSeconds: number, endSeconds: number): PcmAudio {
  assertValidPcm(audio);
  const duration = pcmDuration(audio);
  const start = Math.max(0, Math.min(duration, startSeconds));
  const end = Math.max(start, Math.min(duration, endSeconds));
  const startFrame = Math.floor(start * audio.sampleRate);
  const endFrame = Math.ceil(end * audio.sampleRate);
  return {
    channels: audio.channels.map((channel) => channel.slice(startFrame, endFrame)),
    sampleRate: audio.sampleRate,
  };
}

export function fade(audio: PcmAudio, fadeInSeconds = 0, fadeOutSeconds = 0): PcmAudio {
  assertValidPcm(audio);
  const length = audio.channels[0]?.length ?? 0;
  const fadeInFrames = Math.min(length, Math.max(0, Math.round(fadeInSeconds * audio.sampleRate)));
  const fadeOutFrames = Math.min(
    length,
    Math.max(0, Math.round(fadeOutSeconds * audio.sampleRate)),
  );

  return {
    channels: audio.channels.map((source) => {
      const channel = source.slice();
      for (let frame = 0; frame < fadeInFrames; frame += 1) {
        channel[frame] = (channel[frame] ?? 0) * (frame / Math.max(1, fadeInFrames - 1));
      }
      for (let frame = 0; frame < fadeOutFrames; frame += 1) {
        const index = length - fadeOutFrames + frame;
        channel[index] = (channel[index] ?? 0) * (1 - frame / Math.max(1, fadeOutFrames - 1));
      }
      return channel;
    }),
    sampleRate: audio.sampleRate,
  };
}

export function interleave(audio: PcmAudio): Float32Array {
  assertValidPcm(audio);
  const channelCount = audio.channels.length;
  const frameCount = audio.channels[0]?.length ?? 0;
  const output = new Float32Array(frameCount * channelCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      output[frame * channelCount + channel] = audio.channels[channel]?.[frame] ?? 0;
    }
  }
  return output;
}

export function deinterleave(
  samples: Float32Array,
  channelCount: number,
  sampleRate: number,
): PcmAudio {
  if (!Number.isInteger(channelCount) || channelCount <= 0 || samples.length % channelCount !== 0) {
    throw new AudioEngineError(
      'INVALID_AUDIO_DATA',
      'Interleaved audio has an invalid channel count.',
    );
  }
  const channels = Array.from(
    { length: channelCount },
    () => new Float32Array(samples.length / channelCount),
  );
  for (let frame = 0; frame < samples.length / channelCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const target = channels[channel];
      if (target) target[frame] = samples[frame * channelCount + channel] ?? 0;
    }
  }
  const audio = { channels, sampleRate };
  assertValidPcm(audio);
  return audio;
}
