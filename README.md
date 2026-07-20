# AudioMass Enterprise

AudioMass is a browser-first multitrack audio editor with a production web shell, API gateway, durable projects, direct cloud uploads, and private server-side DSP and transcription.

The interactive editor remains local to the browser for low latency. NestJS owns the public API and orchestration, while FastAPI handles bounded heavy processing through signed storage URLs.

## Stack

- Next.js 16, React 19, App Router, TypeScript, and Tailwind CSS
- NestJS 11 on Fastify with OpenAPI, validation, rate limiting, and API-key authentication
- FastAPI with NumPy, SciPy, Librosa, SoundFile, FFmpeg, and Faster-Whisper
- Prisma 7 and PostgreSQL
- S3, MinIO, Supabase Storage, or Vercel Blob
- pnpm workspaces and Turborepo

## Quick start

Requirements: Node.js 24, pnpm 10.12.3, Python 3.13, PostgreSQL, and FFmpeg/libsndfile for local Python processing.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm --filter @audiomass/database prisma:migrate
pnpm dev
```

In a separate shell:

```bash
cd apps/python-api
python -m venv .venv
.venv/Scripts/python -m pip install --editable ".[dev]"
.venv/Scripts/uvicorn app.main:app --reload
```

On macOS/Linux, use `.venv/bin/python` and `.venv/bin/uvicorn`. Update `.env` for host-local service URLs when not using Compose.

Default development endpoints:

- Web: `http://localhost:3000`
- NestJS: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/docs`
- FastAPI (private): `http://localhost:8000`

For the integrated container stack, copy `.env.example`, replace its secrets, and run `docker compose up --build -d`. See [deployment](docs/DEPLOYMENT.md) for database and bucket initialization.

## Workspace

```text
apps/
  web/            Next.js shell and same-origin legacy editor
  api/            NestJS public API and processing orchestrator
  python-api/     FastAPI analysis, DSP, export, and transcription
packages/
  audio-engine/   Web Audio, worklets, workers, PCM, and peak primitives
  plugin-sdk/     Typed browser plugin lifecycle and RPC
  database/       Prisma schema, client, PostgreSQL adapter, migrations
  config/         Shared TypeScript and ESLint configuration
```

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm clean
```

Python quality commands are documented in [docs/PYTHON_API.md](docs/PYTHON_API.md). CI runs frozen installation, formatting, linting, typechecking, tests, and production builds for both ecosystems.

## Architecture and operations

- [Architecture](docs/ARCHITECTURE.md)
- [NestJS API](docs/API.md)
- [FastAPI processing API](docs/PYTHON_API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations runbook](docs/OPERATIONS.md)
- [Migration record](docs/MIGRATION.md)
- [Original migration audit](MIGRATION_PLAN.md)

The browser calls NestJS only. FastAPI must remain private, and production storage must use short-lived signed URLs with an exact hostname allowlist. The legacy editor is intentionally retained under `apps/web/public/legacy` as an incremental migration boundary.

## License

AudioMass is MIT licensed. Bundled and runtime dependencies retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
