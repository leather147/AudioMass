import { spawnSync } from 'node:child_process';

function runPnpm(arguments_) {
  const result = spawnSync('pnpm', arguments_, {
    cwd: new URL('..', import.meta.url),
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const hasDatabase = Boolean(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);

if (hasDatabase) {
  runPnpm(['--filter', '@audiomass/database', 'prisma:migrate']);
} else {
  console.warn(
    'DATABASE_URL is not available; skipping Prisma migrations for this deployment. ' +
      'Connect Neon and redeploy before serving traffic.',
  );
}

runPnpm(['turbo', 'run', 'build', '--filter=@audiomass/api']);
