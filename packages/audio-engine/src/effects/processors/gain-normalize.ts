import { analyzeLoudness, gainForLoudnessTarget } from '../../analysis/loudness.js';
import { applyGain } from '../../dsp/pcm.js';
import type { PcmAudio } from '../../types.js';
import type { EffectValues } from '../schema.js';
import { requiredBoolean, requiredNumber, requiredString } from './values.js';

function level(channel: Float32Array, mode: 'peak' | 'rms'): number {
  let measured = 0;
  if (mode === 'peak') {
    for (const sample of channel) measured = Math.max(measured, Math.abs(sample));
    return measured;
  }
  for (const sample of channel) measured += sample * sample;
  return Math.sqrt(measured / Math.max(1, channel.length));
}

function normalizeChannels(
  audio: PcmAudio,
  mode: 'peak' | 'rms',
  target: number,
  linked: boolean,
): PcmAudio {
  const measured = audio.channels.map((channel) => level(channel, mode));
  const shared =
    mode === 'peak'
      ? Math.max(0, ...measured)
      : Math.sqrt(
          measured.reduce((sum, value) => sum + value * value, 0) / Math.max(1, measured.length),
        );
  return {
    channels: audio.channels.map((channel, index) => {
      const current = linked ? shared : (measured[index] ?? 0);
      const gain = current > 0 ? target / current : 1;
      return Float32Array.from(channel, (sample) => sample * gain);
    }),
    sampleRate: audio.sampleRate,
  };
}

function normalizeLoudness(audio: PcmAudio, values: EffectValues): PcmAudio {
  const report = analyzeLoudness({
    duration: (audio.channels[0]?.length ?? 0) / audio.sampleRate,
    getChannelData: (channel) => audio.channels[channel]!,
    length: audio.channels[0]?.length ?? 0,
    numberOfChannels: audio.channels.length,
    sampleRate: audio.sampleRate,
  });
  const normalization = gainForLoudnessTarget(
    report,
    requiredNumber(values, 'targetLufs'),
    requiredNumber(values, 'peakCeiling'),
  );
  return applyGain(audio, normalization.gain);
}

export function processGain(audio: PcmAudio, values: EffectValues): PcmAudio {
  return applyGain(audio, requiredNumber(values, 'amount'));
}

export function processNormalize(audio: PcmAudio, values: EffectValues): PcmAudio {
  const mode = requiredString(values, 'mode');
  if (mode === 'lufs') return normalizeLoudness(audio, values);
  if (mode !== 'peak' && mode !== 'rms') {
    throw new TypeError(`Unsupported normalization: ${mode}.`);
  }
  return normalizeChannels(
    audio,
    mode,
    requiredNumber(values, 'amount'),
    requiredBoolean(values, 'linked'),
  );
}
