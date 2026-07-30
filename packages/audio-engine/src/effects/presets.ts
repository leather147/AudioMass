import { EFFECT_SCHEMAS } from './catalog.js';
import {
  effectSchemaById,
  parseEffectValues,
  type EffectParameter,
  type EffectSchema,
  type EffectValues,
} from './schema.js';

export const EFFECT_PRESET_FORMAT = 'audiomass-effect-presets' as const;
export const EFFECT_PRESET_VERSION = 1 as const;

export interface EffectPreset {
  createdAt: string;
  effectId: string;
  id: string;
  name: string;
  updatedAt: string;
  values: EffectValues;
}

export interface EffectPresetDocument {
  format: typeof EFFECT_PRESET_FORMAT;
  presets: readonly EffectPreset[];
  version: typeof EFFECT_PRESET_VERSION;
}

export interface CreateEffectPreset {
  createdAt?: string;
  effectId: string;
  id: string;
  name: string;
  updatedAt?: string;
  values: unknown;
}

interface LegacyPreset {
  date?: unknown;
  id?: unknown;
  name?: unknown;
  val?: unknown;
}

const LEGACY_EFFECT_IDS: Readonly<Record<string, string>> = {
  compressor: 'compressor',
  delay: 'delay',
  dist: 'distortion',
  gain: 'gain',
  graph_eq: 'graphic-equalizer',
  reverb: 'reverb',
};

function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new TypeError(`${field} must be a non-empty string of at most ${maximum} characters.`);
  }
  return value.trim();
}

function isoDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${field} must be an ISO date.`);
  }
  return new Date(value).toISOString();
}

export function emptyEffectPresetDocument(): EffectPresetDocument {
  return { format: EFFECT_PRESET_FORMAT, presets: [], version: EFFECT_PRESET_VERSION };
}

export function createEffectPreset(
  input: CreateEffectPreset,
  schemas: readonly EffectSchema[] = EFFECT_SCHEMAS,
): EffectPreset {
  const now = new Date().toISOString();
  const createdAt = input.createdAt ? isoDate(input.createdAt, 'createdAt') : now;
  const updatedAt = input.updatedAt ? isoDate(input.updatedAt, 'updatedAt') : createdAt;
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new TypeError('updatedAt cannot be earlier than createdAt.');
  }
  const effectId = requiredText(input.effectId, 'effectId', 80);
  const schema = effectSchemaById(schemas, effectId);
  return {
    createdAt,
    effectId,
    id: requiredText(input.id, 'id', 160),
    name: requiredText(input.name, 'name', 16),
    updatedAt,
    values: parseEffectValues(schema, input.values),
  };
}

export function parseEffectPresetDocument(
  value: unknown,
  schemas: readonly EffectSchema[] = EFFECT_SCHEMAS,
): EffectPresetDocument {
  const input = record(value, 'Effect preset document must be an object.');
  if (input.format !== EFFECT_PRESET_FORMAT || input.version !== EFFECT_PRESET_VERSION) {
    throw new TypeError('Unsupported effect preset format or version.');
  }
  if (!Array.isArray(input.presets)) throw new TypeError('Effect presets must be an array.');
  const ids = new Set<string>();
  const presets = input.presets.map((value) => {
    const preset = record(value, 'Effect preset must be an object.');
    const parsed = createEffectPreset(
      {
        createdAt: preset.createdAt as string,
        effectId: preset.effectId as string,
        id: preset.id as string,
        name: preset.name as string,
        updatedAt: preset.updatedAt as string,
        values: preset.values,
      },
      schemas,
    );
    if (ids.has(parsed.id)) throw new TypeError(`Duplicate effect preset id: ${parsed.id}.`);
    ids.add(parsed.id);
    return parsed;
  });
  return { format: EFFECT_PRESET_FORMAT, presets, version: EFFECT_PRESET_VERSION };
}

export function serializeEffectPresetDocument(document: EffectPresetDocument): string {
  return JSON.stringify(parseEffectPresetDocument(document));
}

export function deserializeEffectPresetDocument(source: string): EffectPresetDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch (error) {
    throw new TypeError('Effect preset document is not valid JSON.', { cause: error });
  }
  return parseEffectPresetDocument(parsed);
}

export function upsertEffectPreset(
  document: EffectPresetDocument,
  preset: EffectPreset,
): EffectPresetDocument {
  const parsedDocument = parseEffectPresetDocument(document);
  const parsedPreset = createEffectPreset(preset);
  const existing = parsedDocument.presets.find((candidate) => candidate.id === parsedPreset.id);
  if (existing && existing.effectId !== parsedPreset.effectId) {
    throw new TypeError('An effect preset id cannot move between effects.');
  }
  return {
    ...parsedDocument,
    presets: [
      ...parsedDocument.presets.filter((candidate) => candidate.id !== parsedPreset.id),
      parsedPreset,
    ].sort(
      (left, right) =>
        left.effectId.localeCompare(right.effectId) ||
        left.name.localeCompare(right.name) ||
        left.id.localeCompare(right.id),
    ),
  };
}

export function removeEffectPreset(
  document: EffectPresetDocument,
  presetId: string,
): EffectPresetDocument {
  const parsed = parseEffectPresetDocument(document);
  return { ...parsed, presets: parsed.presets.filter((preset) => preset.id !== presetId) };
}

export function effectPresetsFor(
  document: EffectPresetDocument,
  effectId: string,
): readonly EffectPreset[] {
  effectSchemaById(EFFECT_SCHEMAS, effectId);
  return parseEffectPresetDocument(document).presets.filter(
    (preset) => preset.effectId === effectId,
  );
}

function legacyParameterValue(parameter: EffectParameter, tokens: string[]): unknown {
  if (parameter.kind === 'number-list') {
    return tokens.splice(0, parameter.defaultValue.length).map(Number);
  }
  const token = tokens.shift();
  if (token === undefined) throw new TypeError('Legacy preset has too few values.');
  if (parameter.kind === 'boolean') return token === '1' || token === 'true';
  if (parameter.kind === 'number') return Number(token);
  return token;
}

function legacyValues(schema: EffectSchema, value: unknown): EffectValues {
  const tokens = String(value).split(',');
  const values = Object.fromEntries(
    schema.parameters.map((parameter) => [parameter.id, legacyParameterValue(parameter, tokens)]),
  );
  if (tokens.length > 0) throw new TypeError('Legacy preset has too many values.');
  return parseEffectValues(schema, values);
}

function decodeLegacyName(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'");
}

export function migrateLegacyEffectPresets(
  value: unknown,
  schemas: readonly EffectSchema[] = EFFECT_SCHEMAS,
): EffectPresetDocument {
  const input = record(value, 'Legacy effect presets must be an object.');
  let document = emptyEffectPresetDocument();
  for (const [legacyEffectId, candidate] of Object.entries(input)) {
    const effectId = LEGACY_EFFECT_IDS[legacyEffectId];
    if (!effectId || !Array.isArray(candidate)) continue;
    const schema = effectSchemaById(schemas, effectId);
    for (const item of candidate as LegacyPreset[]) {
      try {
        const timestamp =
          typeof item.date === 'number' && Number.isFinite(item.date)
            ? new Date(item.date).toISOString()
            : new Date(0).toISOString();
        const preset = createEffectPreset(
          {
            createdAt: timestamp,
            effectId,
            id: requiredText(item.id, 'legacy preset id', 160),
            name: decodeLegacyName(requiredText(item.name, 'legacy preset name', 16)),
            updatedAt: timestamp,
            values: legacyValues(schema, item.val),
          },
          schemas,
        );
        document = upsertEffectPreset(document, preset);
      } catch {
        // Only unambiguous, valid legacy presets cross the new strict boundary.
      }
    }
  }
  return document;
}
