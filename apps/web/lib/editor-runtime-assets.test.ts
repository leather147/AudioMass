import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const runtimeSource = join(process.cwd(), 'editor-runtime', 'static');
const runtimeOutput = join(process.cwd(), 'public', 'editor-assets');

function listFiles(root: string, directory = root): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listFiles(root, path) : [relative(root, path)];
  });
}

describe('editor runtime assets', () => {
  it('copies every source asset into the generated public runtime', () => {
    const sourceFiles = listFiles(runtimeSource);
    expect(sourceFiles.length).toBeGreaterThan(100);
    for (const file of sourceFiles) {
      expect(existsSync(join(runtimeOutput, file)), file).toBe(true);
    }
  });

  it('contains no retired HTML entrypoints or legacy asset URLs', () => {
    expect(existsSync(join(process.cwd(), 'public', 'legacy'))).toBe(false);
    expect(existsSync(join(runtimeSource, 'index.html'))).toBe(false);

    for (const file of listFiles(runtimeSource).filter((entry) =>
      /\.(?:css|js|json)$/.test(entry),
    )) {
      const source = readFileSync(join(runtimeSource, file), 'utf8');
      expect(source, file).not.toContain('/legacy/');
      if (file.endsWith('.js')) {
        expect(source, file).not.toMatch(/\b(?:about|eq|mix|sp)\.html\b/);
      }
    }
  });

  it('installs the PWA at the editor route instead of the asset directory', () => {
    const manifest = JSON.parse(readFileSync(join(runtimeSource, 'manifest.json'), 'utf8')) as {
      scope?: string;
      start_url?: string;
    };
    expect(manifest).toMatchObject({ scope: '/', start_url: '/editor' });
  });

  it('centralizes persistence and applies locale changes without navigation', () => {
    for (const file of listFiles(runtimeSource).filter((entry) => entry.endsWith('.js'))) {
      const source = readFileSync(join(runtimeSource, file), 'utf8');
      expect(source, file).not.toMatch(/\b(?:localStorage|sessionStorage)\b/);
    }

    const localeService = readFileSync(join(runtimeOutput, 'locale-service.js'), 'utf8');
    expect(localeService).not.toContain('location.reload');
    expect(localeService).toContain('translateTree(document.documentElement)');
  });
});
