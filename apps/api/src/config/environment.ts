import type { StorageProvider } from '@audiomass/database';

const STORAGE_PROVIDERS: Record<string, StorageProvider> = {
  minio: 'MINIO',
  s3: 'S3',
  supabase: 'SUPABASE',
  'vercel-blob': 'VERCEL_BLOB',
  vercel_blob: 'VERCEL_BLOB',
};

const MINIMUM_API_KEY_LENGTH = 32;

export interface ApiEnvironment {
  API_KEYS: string;
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  PORT: number;
  PYTHON_API_INTERNAL_KEY: string;
  PYTHON_API_TIMEOUT_MS: number;
  PYTHON_API_URL: string;
  STORAGE_BUCKET: string;
  STORAGE_MAX_UPLOAD_BYTES: number;
  STORAGE_PROVIDER: StorageProvider;
  STORAGE_URL_TTL_SECONDS: number;
  VERCEL_BLOB_ACCESS: 'private' | 'public';
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value.trim();
}

function positiveInteger(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
  maximum: number,
): number {
  const value = Number(input[key] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${key} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

function storageProvider(input: Record<string, unknown>): StorageProvider {
  const value = requiredString(input, 'STORAGE_PROVIDER').toLowerCase();
  const provider = STORAGE_PROVIDERS[value];
  if (!provider) {
    throw new Error('STORAGE_PROVIDER must be s3, minio, supabase, or vercel-blob');
  }
  return provider;
}

function validateStorageCredentials(
  input: Record<string, unknown>,
  provider: StorageProvider,
): void {
  if (provider === 'S3' || provider === 'MINIO') {
    requiredString(input, 'S3_REGION');
    requiredString(input, 'S3_KEY');
    requiredString(input, 'S3_SECRET');
    if (provider === 'MINIO') requiredString(input, 'S3_ENDPOINT');
    return;
  }
  if (provider === 'SUPABASE') {
    requiredString(input, 'SUPABASE_URL');
    requiredString(input, 'SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  requiredString(input, 'BLOB_READ_WRITE_TOKEN');
}

export function parseApiKeys(value: string): string[] {
  const keys = value
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error('API_KEYS must contain at least one key');
  }
  if (keys.some((key) => key.length < MINIMUM_API_KEY_LENGTH)) {
    throw new Error(`Every API key must contain at least ${MINIMUM_API_KEY_LENGTH} characters`);
  }
  return keys;
}

export function validateEnvironment(
  input: Record<string, unknown>,
): ApiEnvironment & Record<string, unknown> {
  const port = positiveInteger(input, 'PORT', 4000, 65_535);

  const databaseUrl = requiredString(input, 'DATABASE_URL');
  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must use the postgresql:// protocol');
  }

  const apiKeys = requiredString(input, 'API_KEYS');
  parseApiKeys(apiKeys);

  const pythonApiUrl = requiredString(input, 'PYTHON_API_URL').replace(/\/$/, '');
  let parsedPythonApiUrl: URL;
  try {
    parsedPythonApiUrl = new URL(pythonApiUrl);
  } catch {
    throw new Error('PYTHON_API_URL must be an absolute HTTP(S) URL');
  }
  if (!['http:', 'https:'].includes(parsedPythonApiUrl.protocol)) {
    throw new Error('PYTHON_API_URL must be an absolute HTTP(S) URL');
  }
  const pythonInternalKey = requiredString(input, 'PYTHON_API_INTERNAL_KEY');
  parseApiKeys(pythonInternalKey);
  const pythonTimeoutMs = positiveInteger(input, 'PYTHON_API_TIMEOUT_MS', 900_000, 3_600_000);

  const provider = storageProvider(input);
  const storageBucket = requiredString(input, 'STORAGE_BUCKET');
  const storageUrlTtlSeconds = positiveInteger(input, 'STORAGE_URL_TTL_SECONDS', 900, 86_400);
  const storageMaxUploadBytes = positiveInteger(
    input,
    'STORAGE_MAX_UPLOAD_BYTES',
    536_870_912,
    2_147_483_647,
  );
  validateStorageCredentials(input, provider);

  const blobAccess = input.VERCEL_BLOB_ACCESS ?? 'private';
  if (blobAccess !== 'private' && blobAccess !== 'public') {
    throw new Error('VERCEL_BLOB_ACCESS must be private or public');
  }

  return {
    ...input,
    API_KEYS: apiKeys,
    CORS_ORIGINS:
      typeof input.CORS_ORIGINS === 'string' ? input.CORS_ORIGINS : 'http://localhost:3000',
    DATABASE_URL: databaseUrl,
    NODE_ENV: typeof input.NODE_ENV === 'string' ? input.NODE_ENV : 'development',
    PORT: port,
    STORAGE_BUCKET: storageBucket,
    PYTHON_API_INTERNAL_KEY: pythonInternalKey,
    PYTHON_API_TIMEOUT_MS: pythonTimeoutMs,
    PYTHON_API_URL: pythonApiUrl,
    STORAGE_MAX_UPLOAD_BYTES: storageMaxUploadBytes,
    STORAGE_PROVIDER: provider,
    STORAGE_URL_TTL_SECONDS: storageUrlTtlSeconds,
    VERCEL_BLOB_ACCESS: blobAccess,
  };
}

export function parseCorsOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
