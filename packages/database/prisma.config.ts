import { fileURLToPath } from 'node:url';

import { config as loadEnvironment } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnvironment({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Serverless traffic uses Neon's pooled URL. Schema migrations prefer the
    // direct URL injected by the Neon Vercel integration.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
});
