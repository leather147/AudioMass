import { PrismaPg } from '@prisma/adapter-pg';

export * from './generated/prisma/client.js';

export interface PostgresPoolOptions {
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
}

export function createPostgresAdapter(
  connectionString: string,
  options: PostgresPoolOptions = {},
): PrismaPg {
  return new PrismaPg({
    connectionString,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
    max: options.max ?? 10,
  });
}
