import type { EffectValues } from '../schema.js';

export function requiredNumber(values: EffectValues, id: string): number {
  const value = values[id];
  if (typeof value !== 'number') throw new TypeError(`${id} must be a number.`);
  return value;
}

export function requiredBoolean(values: EffectValues, id: string): boolean {
  const value = values[id];
  if (typeof value !== 'boolean') throw new TypeError(`${id} must be a boolean.`);
  return value;
}

export function requiredString(values: EffectValues, id: string): string {
  const value = values[id];
  if (typeof value !== 'string') throw new TypeError(`${id} must be a string.`);
  return value;
}

export function requiredNumberList(values: EffectValues, id: string): readonly number[] {
  const value = values[id];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'number')) {
    throw new TypeError(`${id} must be a number list.`);
  }
  return value;
}

export function dbToAmplitude(value: number): number {
  return 10 ** (value / 20);
}

export function compatibilityMixGains(mix: number): { dry: number; wet: number } {
  return { dry: 2 * (1 - mix), wet: 2 * mix };
}
