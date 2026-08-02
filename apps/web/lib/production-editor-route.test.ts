import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function routeSource(...segments: string[]): string {
  return readFileSync(join(process.cwd(), 'app', 'editor', ...segments), 'utf8');
}

describe('production editor route', () => {
  it('renders the framework-native shell directly from /editor', () => {
    const source = routeSource('page.tsx');

    expect(source).toContain('EditorShell');
    expect(source).toContain('Promise.all');
    expect(source).toContain('parseEditorPanel(panel)');
    expect(source).not.toMatch(/EditorFrame|iframe|editor-runtime|editor-bridge|components\/tools/);
  });

  it('keeps /editor/native as one validated redirect instead of a second composition', () => {
    const source = routeSource('native', 'page.tsx');

    expect(source).toContain("redirect(selectedPanel === 'waveform' ? '/editor'");
    expect(source).toContain('parseEditorPanel(panel)');
    expect(source).not.toMatch(/EditorShell|readEditorPreferences|EditorFrame/);
  });
});
