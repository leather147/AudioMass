import { rm } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requestedTargets = process.argv.slice(2);
const targets = requestedTargets.length === 0 ? ['.turbo', 'coverage'] : requestedTargets;

function resolveWorkspaceTarget(target) {
  const absoluteTarget = resolve(process.cwd(), target);
  const workspaceRelativePath = relative(workspaceRoot, absoluteTarget);

  if (
    absoluteTarget === workspaceRoot ||
    workspaceRelativePath === '..' ||
    workspaceRelativePath.startsWith('..' + (process.platform === 'win32' ? '\\' : '/'))
  ) {
    throw new Error('Refusing to clean a path outside the workspace: ' + target);
  }

  return absoluteTarget;
}

await Promise.all(
  targets.map((target) => rm(resolveWorkspaceTarget(target), { force: true, recursive: true })),
);
