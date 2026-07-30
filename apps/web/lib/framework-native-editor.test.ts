import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { editorThemeStyle, getEditorTheme } from '@/features/editor/theme/editor-themes';

function featureSources(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return featureSources(path);
      if (!/\.(?:ts|tsx)$/.test(entry.name)) return [];
      return [`// ${path}\n${readFileSync(path, 'utf8')}`];
    })
    .join('\n');
}

describe('framework-native editor boundary', () => {
  it('exposes every theme through typed React styles', () => {
    expect(getEditorTheme('github-light').mode).toBe('light');
    expect(editorThemeStyle('dracula')).toMatchObject({
      '--editor-accent': '#bd93f9',
      colorScheme: 'dark',
    });
  });

  it('does not depend on legacy editor globals or iframe messaging', () => {
    const root = join(process.cwd(), 'features', 'editor');
    const sources = featureSources(root);

    expect(sources).not.toMatch(/PKAudioEditor|PKAudioFX|AMLateRuntimeValue/);
    expect(sources).not.toContain('postMessage');
    expect(sources).not.toContain('<iframe');
  });

  it('owns schema-driven effect workflows inside React and the typed controller', () => {
    const root = join(process.cwd(), 'features', 'editor');
    const sources = featureSources(root);

    expect(sources).toContain('EFFECT_SCHEMAS');
    expect(sources).toContain('controller.previewEffect');
    expect(sources).toContain('controller.applyEffect');
    expect(sources).toContain('BrowserEffectPresetRepository');
    expect(sources).toContain('controller.previewSpecializedEffect');
    expect(sources).toContain('ParagraphicEqualizerForm');
    expect(sources).toContain('AutomationForm');
    expect(sources).toContain('AudioRepairForm');
    expect(sources).not.toMatch(/(?:eq|sp|compressor)\.html/);
  });

  it('keeps direct vendor asset paths in the one infrastructure registry', () => {
    const root = join(process.cwd(), 'features', 'editor');
    const sources = featureSources(root);
    const references = sources.match(/path:\s*'\/editor-assets\//g) ?? [];

    expect(references).toHaveLength(8);
    expect(sources).not.toMatch(/globalThis\.(?:WaveSurfer|lz4BlockCodec|Module)/);
  });
});
