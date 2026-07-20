import { describe, expect, it } from 'vitest';

import { validateStoredObject } from '../src/files/storage-object.validation.js';

describe('uploaded object validation', () => {
  it('accepts exact length and a MIME type with harmless parameters', () => {
    expect(
      validateStoredObject(1024, 'audio/wav', {
        contentType: 'audio/wav; charset=binary',
        size: 1024,
      }),
    ).toEqual([]);
  });

  it('reports length and type mismatches together', () => {
    expect(
      validateStoredObject(1024, 'audio/wav', {
        contentType: 'application/octet-stream',
        size: 512,
      }),
    ).toEqual([
      'expected 1024 bytes but received 512',
      'expected content type audio/wav but received application/octet-stream',
    ]);
  });
});
