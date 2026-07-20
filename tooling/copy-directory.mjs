import { cpSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const [sourceArgument, destinationArgument] = process.argv.slice(2);
if (!sourceArgument || !destinationArgument) {
  throw new Error('Usage: node tooling/copy-directory.mjs <source> <destination>');
}

const workspaceRoot = resolve(import.meta.dirname, '..');
const source = resolve(workspaceRoot, sourceArgument);
const destination = resolve(workspaceRoot, destinationArgument);

if (!existsSync(source) || !statSync(source).isDirectory()) {
  throw new Error(`Source directory does not exist: ${sourceArgument}`);
}

cpSync(source, destination, { errorOnExist: false, force: true, recursive: true });
