import { AudioEngineError } from '../errors.js';
import { assertValidPcm, clonePcm } from '../dsp/pcm.js';
import type { PcmAudio } from '../types.js';
import { getEffectSchema } from './catalog.js';
import { processDelay, processReverb } from './processors/delay-reverb.js';
import { processDistortion } from './processors/distortion.js';
import { processCompressor, processHardLimiter } from './processors/dynamics.js';
import { processGraphicEqualizer } from './processors/equalizer.js';
import { processGain, processNormalize } from './processors/gain-normalize.js';
import { parseEffectValues, type EffectValues } from './schema.js';

export const NATIVE_EFFECT_PROCESSOR_IDS = [
  'gain',
  'compressor',
  'normalize',
  'hard-limiter',
  'delay',
  'distortion',
  'reverb',
  'graphic-equalizer',
] as const;

export type NativeEffectProcessorId = (typeof NATIVE_EFFECT_PROCESSOR_IDS)[number];
export type NativeEffectProcessor = (audio: PcmAudio, values: EffectValues) => PcmAudio;

const DEFAULT_PROCESSORS: Readonly<Record<NativeEffectProcessorId, NativeEffectProcessor>> = {
  compressor: processCompressor,
  delay: processDelay,
  distortion: processDistortion,
  gain: processGain,
  'graphic-equalizer': processGraphicEqualizer,
  'hard-limiter': processHardLimiter,
  normalize: processNormalize,
  reverb: processReverb,
};

export class EffectProcessorRegistry {
  private readonly processors: ReadonlyMap<string, NativeEffectProcessor>;

  public constructor(
    processors: ReadonlyMap<string, NativeEffectProcessor> = new Map(
      NATIVE_EFFECT_PROCESSOR_IDS.map((effectId) => [effectId, DEFAULT_PROCESSORS[effectId]]),
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
