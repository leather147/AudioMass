import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { editorThemeStyle, getEditorTheme } from '@/features/editor/theme/editor-themes';

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
    const sources = [
      join(root, 'application', 'editor-controller.ts'),
      join(root, 'components', 'editor-shell.tsx'),
      join(root, 'state', 'editor-store.tsx'),
      join(root, 'theme', 'editor-themes.ts'),
    ]
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(sources).not.toMatch(/PKAudioEditor|PKAudioFX|AMLateRuntimeValue/);
    expect(sources).not.toContain('postMessage');
    expect(sources).not.toContain('<iframe');
  });
});
