import { describe, expect, it } from 'vitest';

import { S3StorageAdapter } from '../src/storage/providers/s3-storage.adapter.js';

describe('S3 direct transfer grants', () => {
  it('signs an upload without contacting the object store', async () => {
    const adapter = new S3StorageAdapter({
      accessKeyId: 'test-access-key',
      bucket: 'audiomass',
      endpoint: 'https://minio.example.com',
      provider: 'MINIO',
      region: 'us-east-1',
      secretAccessKey: 'test-secret-key',
      ttlSeconds: 300,
    });

    const grant = await adapter.createUploadGrant({
      contentType: 'audio/wav',
      expectedSize: 2048,
      objectKey: 'tenant/2026/07/20/audio.wav',
    });

    const url = new URL(grant.url);
    expect(grant.method).toBe('PUT');
    expect(grant.headers['content-type']).toBe('audio/wav');
    expect(url.hostname).toBe('minio.example.com');
    expect(url.pathname).toContain('/audiomass/tenant/2026/07/20/audio.wav');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
  });
});
