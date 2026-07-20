import { describe, expect, it } from 'vitest';

import { parseCorsOrigins, validateEnvironment } from '../src/config/environment.js';

const API_KEY = 'a'.repeat(32);

describe('environment validation', () => {
  it('normalizes a valid production environment', () => {
    const result = validateEnvironment({
      API_KEYS: API_KEY,
      DATABASE_URL: 'postgresql://user:secret@db:5432/audiomass',
      S3_KEY: 'access-key',
      PYTHON_API_INTERNAL_KEY: 'p'.repeat(32),
      PYTHON_API_URL: 'http://python-api:8000',
      PYTHON_API_TIMEOUT_MS: '120000',
      S3_REGION: 'eu-central-1',
      S3_SECRET: 'secret-key',
      STORAGE_BUCKET: 'audiomass',
      STORAGE_PROVIDER: 's3',
      PORT: '4100',
    });

    expect(result.PORT).toBe(4100);
    expect(result.NODE_ENV).toBe('development');
  });

  it('rejects weak API keys and non-PostgreSQL data sources', () => {
    expect(() =>
      validateEnvironment({
        API_KEYS: 'short',
        DATABASE_URL: 'postgresql://db/audiomass',
      }),
    ).toThrow('at least 32 characters');
    expect(() =>
      validateEnvironment({
        API_KEYS: API_KEY,
        DATABASE_URL: 'file:./local.db',
      }),
    ).toThrow('postgresql://');
  });

  it('parses an explicit CORS allowlist', () => {
    expect(parseCorsOrigins('https://app.example.com, https://admin.example.com')).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });
});
