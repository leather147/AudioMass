import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];

if (mode !== '--write' && mode !== '--check') {
  throw new Error('Usage: node tooling/prettier.mjs --write|--check');
}

const listing = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: workspaceRoot,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});

if (listing.status !== 0) {
  process.stderr.write(listing.stderr);
  process.exit(listing.status ?? 1);
}

const files = listing.stdout
  .split('\0')
  .filter(Boolean)
  .filter((file) => existsSync(resolve(workspaceRoot, file)));
const prettier = resolve(workspaceRoot, 'node_modules/prettier/bin/prettier.cjs');
const chunkSize = 100;

for (let offset = 0; offset < files.length; offset += chunkSize) {
  const result = spawnSync(
    process.execPath,
    [
      prettier,
      mode,
      '--ignore-path',
      resolve(workspaceRoot, '.prettierignore'),
      '--ignore-unknown',
      ...files.slice(offset, offset + chunkSize),
    ],
    { cwd: workspaceRoot, stdio: 'inherit' },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
