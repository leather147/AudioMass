import type { StoredObjectMetadata } from '../storage/storage.types.js';

function baseMimeType(value: string): string {
  return value.split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

export function validateStoredObject(
  expectedSize: number,
  expectedContentType: string,
  actual: StoredObjectMetadata,
): string[] {
  const errors: string[] = [];
  if (actual.size !== expectedSize) {
    errors.push(`expected ${expectedSize} bytes but received ${actual.size}`);
  }
  if (baseMimeType(actual.contentType) !== baseMimeType(expectedContentType)) {
    errors.push(`expected content type ${expectedContentType} but received ${actual.contentType}`);
  }
  return errors;
}
