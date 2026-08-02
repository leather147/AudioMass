import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredDocuments = [
  'MIGRATION_PLAN.md',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'docs/API.md',
  'docs/ARCHITECTURE.md',
  'docs/DEPLOYMENT.md',
  'docs/EDITOR_RUNTIME_REWRITE.md',
  'docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md',
  'docs/MIGRATION.md',
  'docs/OPERATIONS.md',
  'docs/PYTHON_API.md',
  'docs/VERCEL_ONLY_DEPLOYMENT.md',
];

const listing = spawnSync('git', ['ls-files', '*.md'], {
  cwd: workspaceRoot,
  encoding: 'utf8',
});

if (listing.status !== 0) {
  process.stderr.write(listing.stderr);
  process.exit(listing.status ?? 1);
}

const documents = listing.stdout.split(/\r?\n/).filter(Boolean);
const documentSet = new Set(documents);
const failures = [];
let checkedLinks = 0;

for (const required of requiredDocuments) {
  if (!documentSet.has(required)) failures.push(`Missing required document: ${required}`);
}

for (const document of documents) {
  const absoluteDocument = resolve(workspaceRoot, document);
  const content = readFileSync(absoluteDocument, 'utf8');
  if (!content.trimStart().startsWith('# ')) {
    failures.push(`${document}: the first content must be a level-one heading`);
  }

  const withoutCodeFences = content.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutCodeFences.matchAll(/!?\[[^\]]*\]\(([^)\n]+)\)/g)) {
    const rawTarget = match[1]?.trim();
    if (!rawTarget) continue;
    const target = rawTarget.startsWith('<')
      ? rawTarget.slice(1, rawTarget.indexOf('>'))
      : rawTarget.split(/\s+/)[0];
    if (!target || /^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;

    const path = target.split('#', 1)[0]?.split('?', 1)[0];
    if (!path) continue;
    checkedLinks += 1;
    const decodedPath = decodeURIComponent(path);
    const absoluteTarget = resolve(dirname(absoluteDocument), decodedPath);
    if (!existsSync(absoluteTarget)) {
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      failures.push(`${document}:${line}: missing local link target ${target}`);
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(
  `Documentation check passed: ${documents.length} tracked Markdown files, ${checkedLinks} local links.\n`,
);
