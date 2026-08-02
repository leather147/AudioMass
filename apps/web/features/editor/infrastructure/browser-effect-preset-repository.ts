import {
  createEffectPreset,
  deserializeEffectPresetDocument,
  effectPresetsFor,
  emptyEffectPresetDocument,
  migrateLegacyEffectPresets,
  removeEffectPreset,
  serializeEffectPresetDocument,
  upsertEffectPreset,
  type EffectPreset,
  type EffectPresetDocument,
  type EffectValues,
} from '@audiomass/audio-engine';

export interface SaveEffectPreset {
  effectId: string;
  id?: string;
  name: string;
  values: EffectValues;
}

const STORAGE_KEY = 'audiomass.effect-presets.v1';
const PREFERENCES_KEY = 'audiomass.preferences.v1';
const LEGACY_STORAGE_KEY = 'pk_presetfx';

function parseJson(source: string | null): unknown {
  if (!source) return undefined;
  try {
    return JSON.parse(source) as unknown;
  } catch {
    return undefined;
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function defaultId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preset-${Date.now().toString(36)}`;
}

export class BrowserEffectPresetRepository {
  constructor(
    private readonly storage: Storage = globalThis.localStorage,
    private readonly idFactory: () => string = defaultId,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(effectId?: string): readonly EffectPreset[] {
    const document = this.read();
    return effectId ? effectPresetsFor(document, effectId) : document.presets;
  }

  save(input: SaveEffectPreset): EffectPreset {
    const document = this.read();
    const existing = input.id
      ? document.presets.find((preset) => preset.id === input.id)
      : undefined;
    const timestamp = this.now().toISOString();
    const preset = createEffectPreset({
      createdAt: existing?.createdAt ?? timestamp,
      effectId: input.effectId,
      id: input.id ?? this.idFactory(),
      name: input.name,
      updatedAt: timestamp,
      values: input.values,
    });
    this.write(upsertEffectPreset(document, preset));
    return preset;
  }

  delete(presetId: string): void {
    this.write(removeEffectPreset(this.read(), presetId));
  }

  clear(): void {
    this.write(emptyEffectPresetDocument());
  }

  private read(): EffectPresetDocument {
    const current = this.storage.getItem(STORAGE_KEY);
    if (current) {
      try {
        return deserializeEffectPresetDocument(current);
      } catch {
        return emptyEffectPresetDocument();
      }
    }

    const preferences = record(parseJson(this.storage.getItem(PREFERENCES_KEY)));
    const legacy =
      preferences?.effectPresets ?? parseJson(this.storage.getItem(LEGACY_STORAGE_KEY));
    if (!legacy) return emptyEffectPresetDocument();
    try {
      const migrated = migrateLegacyEffectPresets(legacy);
      this.write(migrated);
      return migrated;
    } catch {
      return emptyEffectPresetDocument();
    }
  }

  private write(document: EffectPresetDocument): void {
    this.storage.setItem(STORAGE_KEY, serializeEffectPresetDocument(document));
  }
}
