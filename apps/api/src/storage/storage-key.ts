import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';

const SAFE_EXTENSION = /^\.[a-z0-9]{1,12}$/i;

export function createStorageObjectKey(
  ownerId: string,
  fileName: string,
  now = new Date(),
): string {
  const ownerNamespace = createHash('sha256').update(ownerId).digest('hex').slice(0, 24);
  const extensionCandidate = extname(fileName).toLowerCase();
  const extension = SAFE_EXTENSION.test(extensionCandidate) ? extensionCandidate : '';
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${ownerNamespace}/${year}/${month}/${day}/${randomUUID()}${extension}`;
}
