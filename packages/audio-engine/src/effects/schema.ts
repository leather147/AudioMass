export type EffectParameterValue = boolean | number | readonly number[] | string;
export type EffectValues = Readonly<Record<string, EffectParameterValue>>;

interface EffectParameterBase {
  description?: string;
  id: string;
  label: string;
}

export interface NumberEffectParameter extends EffectParameterBase {
  defaultValue: number;
  kind: 'number';
  maximum: number;
  minimum: number;
  step: number;
  unit?: string;
}

export interface BooleanEffectParameter extends EffectParameterBase {
  defaultValue: boolean;
  kind: 'boolean';
}

export interface SelectEffectParameterOption {
  id: string;
  label: string;
}

export interface SelectEffectParameter extends EffectParameterBase {
  defaultValue: string;
  kind: 'select';
  options: readonly SelectEffectParameterOption[];
}

export interface NumberListEffectParameter extends EffectParameterBase {
  defaultValue: readonly number[];
  itemLabels?: readonly string[];
  kind: 'number-list';
  maximum: number;
  minimum: number;
  step: number;
  unit?: string;
}

export type EffectParameter =
  | BooleanEffectParameter
  | NumberEffectParameter
  | NumberListEffectParameter
  | SelectEffectParameter;

export interface BuiltInEffectPreset {
  id: string;
  name: string;
  values: EffectValues;
}

export interface EffectSchema {
  builtInPresets: readonly BuiltInEffectPreset[];
  description: string;
  id: string;
  name: string;
  parameters: readonly EffectParameter[];
  preview: boolean;
}

function valueRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Effect values must be an object.');
  }
  return value as Record<string, unknown>;
}

function parseNumber(parameter: NumberEffectParameter, value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < parameter.minimum ||
    value > parameter.maximum
  ) {
    throw new TypeError(
      `${parameter.id} must be a finite number from ${parameter.minimum} to ${parameter.maximum}.`,
    );
  }
  return value;
}

function parseParameter(parameter: EffectParameter, value: unknown): EffectParameterValue {
  if (parameter.kind === 'number') return parseNumber(parameter, value);
  if (parameter.kind === 'boolean') {
    if (typeof value !== 'boolean') throw new TypeError(`${parameter.id} must be a boolean.`);
    return value;
  }
  if (parameter.kind === 'select') {
    if (typeof value !== 'string' || !parameter.options.some((option) => option.id === value)) {
      throw new TypeError(`${parameter.id} must be one of the declared options.`);
    }
    return value;
  }
  if (!Array.isArray(value) || value.length !== parameter.defaultValue.length) {
    throw new TypeError(`${parameter.id} must contain ${parameter.defaultValue.length} numbers.`);
  }
  return value.map((item) =>
    parseNumber(
      {
        ...parameter,
        defaultValue: 0,
        kind: 'number',
      },
      item,
    ),
  );
}

export function defaultEffectValues(schema: EffectSchema): EffectValues {
  return Object.fromEntries(
    schema.parameters.map((parameter) => [
      parameter.id,
      Array.isArray(parameter.defaultValue) ? [...parameter.defaultValue] : parameter.defaultValue,
    ]),
  );
}

export function parseEffectValues(schema: EffectSchema, value: unknown): EffectValues {
  const input = valueRecord(value);
  const parameters = new Map(schema.parameters.map((parameter) => [parameter.id, parameter]));
  for (const key of Object.keys(input)) {
    if (!parameters.has(key)) throw new TypeError(`Unknown ${schema.id} parameter: ${key}.`);
  }
  const result: Record<string, EffectParameterValue> = {};
  for (const parameter of schema.parameters) {
    const candidate = Object.hasOwn(input, parameter.id)
      ? input[parameter.id]
      : parameter.defaultValue;
    result[parameter.id] = parseParameter(parameter, candidate);
  }
  return result;
}

export function effectSchemaById(schemas: readonly EffectSchema[], effectId: string): EffectSchema {
  const schema = schemas.find((candidate) => candidate.id === effectId);
  if (!schema) throw new TypeError(`Unknown effect: ${effectId}.`);
  return schema;
}

export function validateEffectSchema(schema: EffectSchema): EffectSchema {
  if (!schema.id.trim() || !schema.name.trim())
    throw new TypeError('Effect id and name are required.');
  const parameterIds = new Set<string>();
  for (const parameter of schema.parameters) {
    if (!parameter.id.trim() || parameterIds.has(parameter.id)) {
      throw new TypeError(`Duplicate or empty parameter id in effect ${schema.id}.`);
    }
    parameterIds.add(parameter.id);
    parseParameter(parameter, parameter.defaultValue);
  }
  const presetIds = new Set<string>();
  for (const preset of schema.builtInPresets) {
    if (!preset.id.trim() || presetIds.has(preset.id)) {
      throw new TypeError(`Duplicate or empty preset id in effect ${schema.id}.`);
    }
    presetIds.add(preset.id);
    parseEffectValues(schema, preset.values);
  }
  return schema;
}
