import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const roots = ['.turbo', 'coverage'];

await Promise.all(
  roots.map((directory) => rm(resolve(process.cwd(), directory), { force: true, recursive: true })),
);
