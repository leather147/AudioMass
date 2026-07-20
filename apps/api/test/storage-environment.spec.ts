import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../src/config/environment.js';

const BASE = {
  API_KEYS: 'a'.repeat(32),
  DATABASE_URL: 'postgresql://user:secret@db:5432/audiomass',
  PYTHON_API_INTERNAL_KEY: 'p'.repeat(32),
  PYTHON_API_URL: 'http://python-api:8000',
  STORAGE_BUCKET: 'audiomass',
};

describe('storage environment validation', () => {
  it.each([
    ['s3', { S3_KEY: 'key', S3_REGION: 'eu-central-1', S3_SECRET: 'secret' }, 'S3'],
    [
      'minio',
      {
        S3_ENDPOINT: 'http://minio:9000',
        S3_KEY: 'key',
        S3_REGION: 'us-east-1',
        S3_SECRET: 'secret',
      },
      'MINIO',
    ],
    [
      'supabase',
      { SUPABASE_SERVICE_ROLE_KEY: 'service-role', SUPABASE_URL: 'https://project.supabase.co' },
      'SUPABASE',
    ],
    ['vercel-blob', { BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_value' }, 'VERCEL_BLOB'],
  ])('normalizes %s configuration', (provider, credentials, normalized) => {
    const result = validateEnvironment({
      ...BASE,
      ...credentials,
      STORAGE_PROVIDER: provider,
    });
    expect(result.STORAGE_PROVIDER).toBe(normalized);
    expect(result.STORAGE_URL_TTL_SECONDS).toBe(900);
  });

  it('requires the endpoint for MinIO and limits signed URL duration', () => {
    expect(() =>
      validateEnvironment({
        ...BASE,
        S3_KEY: 'key',
        S3_REGION: 'us-east-1',
        S3_SECRET: 'secret',
        STORAGE_PROVIDER: 'minio',
      }),
    ).toThrow('S3_ENDPOINT');
    expect(() =>
      validateEnvironment({
        ...BASE,
        BLOB_READ_WRITE_TOKEN: 'token',
        STORAGE_PROVIDER: 'vercel-blob',
        STORAGE_URL_TTL_SECONDS: 100_000,
      }),
    ).toThrow('between 1 and 86400');
  });
});
