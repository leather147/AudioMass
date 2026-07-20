import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { EDITOR_TOOL_ROUTES, editorToolRoute } from '@/lib/editor-tool-routes';

describe('editor tool routes', () => {
  it('provides App Router URLs for every editor tool', () => {
    expect(editorToolRoute('eq')).toBe('/tools/frequency-analyser');
    expect(editorToolRoute('sp', true)).toBe('/tools/spectral-analyser?embedded=1');
    expect(editorToolRoute('mix')).toBe('/tools/multitrack-mixer');
  });

  it('keeps the runtime menu in sync with the typed route map', () => {
    const runtime = readFileSync(join(process.cwd(), 'editor-runtime/static/ui-fx.js'), 'utf8');
    for (const route of Object.values(EDITOR_TOOL_ROUTES)) expect(runtime).toContain(route);
    expect(runtime).not.toContain("'/' + url + '.html'");
  });
});
