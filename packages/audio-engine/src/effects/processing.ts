import { analyzeLoudness, gainForLoudnessTarget } from '../analysis/loudness.js';
import { AudioEngineError } from '../errors.js';
import { applyGain, assertValidPcm, clonePcm } from '../dsp/pcm.js';
import type { PcmAudio } from '../types.js';
import { getEffectSchema } from './catalog.js';
import { parseEffectValues, type EffectValues } from './schema.js';

export const NATIVE_EFFECT_PROCESSOR_IDS = ['gain', 'normalize'] as const;

export type NativeEffectProcessorId = (typeof NATIVE_EFFECT_PROCESSOR_IDS)[number];
export type NativeEffectProcessor = (audio: PcmAudio, values: EffectValues) => PcmAudio;

function requiredNumber(values: EffectValues, id: string): number {
  const value = values[id];
  if (typeof value !== 'number') throw new TypeError(`${id} must be a number.`);
  return value;
}

function requiredBoolean(values: EffectValues, id: string): boolean {
  const value = values[id];
  if (typeof value !== 'boolean') throw new TypeError(`${id} must be a boolean.`);
  return value;
}

function requiredString(values: EffectValues, id: string): string {
  const value = values[id];
  if (typeof value !== 'string') throw new TypeError(`${id} must be a string.`);
  return value;
}

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

const DEFAULT_PROCESSORS: Readonly<Record<NativeEffectProcessorId, NativeEffectProcessor>> = {
  gain: (audio, values) => applyGain(audio, requiredNumber(values, 'amount')),
  normalize: (audio, values) => {
    const mode = requiredString(values, 'mode');
    if (mode === 'lufs') return normalizeLoudness(audio, values);
    if (mode !== 'peak' && mode !== 'rms')
      throw new TypeError(`Unsupported normalization: ${mode}.`);
    return normalizeChannels(
      audio,
      mode,
      requiredNumber(values, 'amount'),
      requiredBoolean(values, 'linked'),
    );
  },
};

export class EffectProcessorRegistry {
  private readonly processors: ReadonlyMap<string, NativeEffectProcessor>;

  public constructor(
    processors: ReadonlyMap<string, NativeEffectProcessor> = new Map(
      Object.entries(DEFAULT_PROCESSORS),
    ),
  ) {
    this.processors = new Map(processors);
  }

  public get supportedEffectIds(): readonly string[] {
    return [...this.processors.keys()];
  }

  public supports(effectId: string): boolean {
    return this.processors.has(effectId);
  }

  public apply(audio: PcmAudio, effectId: string, input: unknown): PcmAudio {
    assertValidPcm(audio);
    const processor = this.processors.get(effectId);
    if (!processor) {
      throw new AudioEngineError(
        'UNSUPPORTED_OPERATION',
        `Effect ${effectId} does not have a native processor yet.`,
      );
    }
    const values = parseEffectValues(getEffectSchema(effectId), input);
    const output = processor(clonePcm(audio), values);
    assertValidPcm(output);
    return output;
  }
}
