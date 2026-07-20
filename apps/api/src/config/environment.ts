const MINIMUM_API_KEY_LENGTH = 32;

export interface ApiEnvironment {
  API_KEYS: string;
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  NODE_ENV: string;
  PORT: number;
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value.trim();
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
  const portValue = input.PORT ?? 4000;
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const databaseUrl = requiredString(input, 'DATABASE_URL');
  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must use the postgresql:// protocol');
  }

  const apiKeys = requiredString(input, 'API_KEYS');
  parseApiKeys(apiKeys);

  return {
    ...input,
    API_KEYS: apiKeys,
    CORS_ORIGINS:
      typeof input.CORS_ORIGINS === 'string' ? input.CORS_ORIGINS : 'http://localhost:3000',
    DATABASE_URL: databaseUrl,
    NODE_ENV: typeof input.NODE_ENV === 'string' ? input.NODE_ENV : 'development',
    PORT: port,
  };
}

export function parseCorsOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
