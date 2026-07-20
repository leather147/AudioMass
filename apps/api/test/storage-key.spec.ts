import { describe, expect, it } from 'vitest';

import { createStorageObjectKey } from '../src/storage/storage-key.js';

describe('storage object keys', () => {
  it('uses an opaque owner namespace, UTC date, UUID, and safe extension', () => {
    const key = createStorageObjectKey(
      'customer@example.com',
      'Lead Vocal.WAV',
      new Date('2026-07-20T12:00:00.000Z'),
    );

    expect(key).toMatch(/^[a-f0-9]{24}\/2026\/07\/20\/[a-f0-9-]{36}\.wav$/);
    expect(key).not.toContain('customer');
    expect(key).not.toContain('Lead Vocal');
  });

  it('drops unsafe or excessively long extensions', () => {
    expect(createStorageObjectKey('owner', 'recording.this-extension-is-too-long')).not.toContain(
      '.this-extension-is-too-long',
    );
  });
});
