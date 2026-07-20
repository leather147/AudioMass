import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { renderEditorRuntimeDocument } from '@/lib/editor-runtime-document';
import {
  EDITOR_BOOTSTRAP_SCRIPTS,
  EDITOR_RUNTIME_SCRIPTS,
  EDITOR_STYLESHEETS,
  editorAssetPath,
} from '@/lib/editor-runtime-manifest';

describe('editor runtime document', () => {
  it('renders every declared asset exactly once and uses the runtime base', () => {
    const document = renderEditorRuntimeDocument();
    expect(document).toContain('<base href="/editor-assets/">');
    for (const asset of [
      ...EDITOR_BOOTSTRAP_SCRIPTS,
      ...EDITOR_STYLESHEETS,
      ...EDITOR_RUNTIME_SCRIPTS,
    ]) {
      expect(document.split(editorAssetPath(asset))).toHaveLength(2);
    }
  });

  it('points only to assets that exist in the public runtime directory', () => {
    for (const asset of [
      ...EDITOR_BOOTSTRAP_SCRIPTS,
      ...EDITOR_STYLESHEETS,
      ...EDITOR_RUNTIME_SCRIPTS,
    ]) {
      const publicPath = editorAssetPath(asset).slice(1);
      expect(existsSync(join(process.cwd(), 'public', publicPath)), asset).toBe(true);
    }
  });

  it('preserves dependency order and installs the bridge after initialization', () => {
    const document = renderEditorRuntimeDocument();
    expect(document.indexOf('/editor-assets/preferences.js')).toBeLessThan(
      document.indexOf('/editor-assets/theme-service.js'),
    );
    expect(document.indexOf('/editor-assets/app.js')).toBeLessThan(
      document.indexOf('/editor-assets/ui.js'),
    );
    expect(document.indexOf('/editor-assets/engine.js')).toBeLessThan(
      document.indexOf('/editor-assets/multitrack.js'),
    );
    expect(document.indexOf('/editor-assets/audio-effect-utilities.js')).toBeLessThan(
      document.indexOf('/editor-assets/actions.js'),
    );
    expect(document.indexOf('/editor-assets/audio-buffer-operations.js')).toBeLessThan(
      document.indexOf('/editor-assets/actions.js'),
    );
    expect(document.indexOf("PKAudioEditor.init('app')")).toBeLessThan(
      document.indexOf('AMInstallNextBridge(editor)'),
    );
  });

  it('does not reference a static editor HTML entrypoint', () => {
    expect(renderEditorRuntimeDocument()).not.toContain('index.html');
  });

  it('does not expose the removed legacy asset namespace', () => {
    expect(renderEditorRuntimeDocument()).not.toContain('/legacy/');
    expect(existsSync(join(process.cwd(), 'public', 'legacy'))).toBe(false);
  });
});
