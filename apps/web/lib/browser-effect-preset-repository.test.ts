import { describe, expect, it } from 'vitest';

import { BrowserEffectPresetRepository } from '@/features/editor/infrastructure/browser-effect-preset-repository';

class MemoryStorage implements Storage {
  readonly #values = new Map<string, string>();

  get length(): number {
    return this.#values.size;
  }

  clear(): void {
    this.#values.clear();
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }
}

describe('browser effect preset repository', () => {
  it('creates, updates, lists, and deletes versioned typed presets', () => {
    const storage = new MemoryStorage();
    const repository = new BrowserEffectPresetRepository(
      storage,
      () => 'preset-1',
      () => new Date('2026-07-30T00:00:00.000Z'),
    );
    const created = repository.save({
      effectId: 'gain',
      name: 'Quiet',
      values: { amount: 0.5 },
    });
    const updated = repository.save({
      effectId: 'gain',
      id: created.id,
      name: 'Quieter',
      values: { amount: 0.25 },
    });

    expect(repository.list('gain')).toEqual([updated]);
    expect(storage.getItem('audiomass.effect-presets.v1')).toContain('audiomass-effect-presets');
    repository.delete(created.id);
    expect(repository.list()).toEqual([]);
  });

  it('migrates the nested compatibility preference once into the new key', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'audiomass.preferences.v1',
      JSON.stringify({
        effectPresets: {
          delay: [
            {
              date: 1_722_297_600_000,
              id: 'delay_old',
              name: 'Echo',
              val: '0.3,0.4,0.4',
            },
          ],
        },
      }),
    );
    const repository = new BrowserEffectPresetRepository(storage);

    expect(repository.list('delay')[0]).toMatchObject({
      id: 'delay_old',
      values: { delaySeconds: 0.3, feedback: 0.4, mix: 0.4 },
    });
    expect(storage.getItem('audiomass.effect-presets.v1')).not.toBeNull();
  });

  it('fails closed when the current document is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('audiomass.effect-presets.v1', '{broken');
    const repository = new BrowserEffectPresetRepository(storage);
    expect(repository.list()).toEqual([]);
  });
});
