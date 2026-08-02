import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const webRoot = process.cwd();
const workspaceRoot = resolve(webRoot, '../..');

function source(...segments: string[]): string {
  return readFileSync(join(workspaceRoot, ...segments), 'utf8');
}

describe('Wave F compatibility deletion', () => {
  it('removes the classic runtime, iframe bridge, tool hosts, and compiler helpers', () => {
    for (const path of [
      'apps/web/editor-runtime',
      'apps/web/app/editor-runtime',
      'apps/web/components/editor',
      'apps/web/components/tools',
      'apps/web/lib/editor-bridge.ts',
      'apps/web/lib/editor-runtime-document.ts',
      'apps/web/lib/editor-runtime-manifest.ts',
      'tooling/copy-directory.mjs',
      'tooling/eslint-classic-runtime.mjs',
    ]) {
      expect(existsSync(join(workspaceRoot, path)), path).toBe(false);
    }
  });

  it('contains no runtime compiler or generated asset configuration', () => {
    const configuration = [
      source('package.json'),
      source('turbo.json'),
      source('.gitignore'),
      source('eslint.config.mjs'),
      source('apps/web/package.json'),
      source('apps/web/eslint.config.mjs'),
      source('apps/web/tsconfig.json'),
      source('packages/config/eslint.config.mjs'),
    ].join('\n');

    expect(configuration).not.toMatch(/editor-runtime|editor-assets|runtime:build/);
  });

  it.each([
    ['frequency-analyser', 'frequency'],
    ['spectral-analyser', 'spectral'],
    ['multitrack-mixer', 'mixer'],
  ])('redirects /tools/%s to the native %s panel', (route, panel) => {
    const routeSource = source('apps/web/app/tools', route, 'page.tsx');
    expect(routeSource).toContain(`redirect('/editor?panel=${panel}')`);
    expect(routeSource).not.toMatch(/components\/tools|PKAudioEditor|iframe/);
  });

  it('owns PWA metadata and offline caching without classic assets', () => {
    const manifest = source('apps/web/app/manifest.ts');
    const hook = source('apps/web/features/editor/infrastructure/use-offline-cache.ts');
    const worker = source('apps/web/public/sw.js');

    expect(manifest).toContain("start_url: '/editor'");
    expect(hook).toContain("register('/sw.js'");
    expect(hook).toContain("performance.getEntriesByType('resource')");
    expect(hook).toContain("!url.pathname.startsWith('/api/')");
    expect(hook).toContain("const CACHE_CONFIRMATION = 'CACHE_URLS_COMPLETE'");
    expect(worker).toContain("const CORE_ROUTES = ['/editor'");
    expect(worker).toContain("postMessage({ type: 'CACHE_URLS_COMPLETE' })");
    expect(`${manifest}\n${hook}\n${worker}`).not.toMatch(/editor-runtime|editor-assets/);
  });
});
