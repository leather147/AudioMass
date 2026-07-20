# Deployment

## Production topology

Deploy the web, API, and Python services independently. Use managed PostgreSQL and one supported cloud object store. Only the web and NestJS API are public; FastAPI and PostgreSQL stay on private networking.

| Component         | Artifact                            | Public port       | State                                           |
| ----------------- | ----------------------------------- | ----------------- | ----------------------------------------------- |
| Web               | `apps/web/Dockerfile` or Vercel     | 3000              | Stateless                                       |
| API               | `apps/api/Dockerfile`               | 4000              | Stateless                                       |
| Python processing | `apps/python-api/Dockerfile`        | None              | Stateless with ephemeral temp files/model cache |
| PostgreSQL        | Managed service or Compose          | None              | Durable                                         |
| Object storage    | S3, MinIO, Supabase, or Vercel Blob | Provider-specific | Durable                                         |

## Local integrated stack

1. Copy `.env.example` to `.env`.
2. Replace all example secrets. `API_KEYS` and `PYTHON_API_INTERNAL_KEY` must each be at least 32 characters.
3. Start the stack: `docker compose up --build -d`.
4. Check `http://localhost:3000`, `http://localhost:4000/api/v1/health/ready`, and `http://localhost:4000/docs`.

The Compose stack creates the MinIO bucket and applies Prisma migrations before the API starts.
It publishes the MinIO console on port 9001 for local administration, but does not publish
FastAPI or PostgreSQL.

## Database release step

Run migrations once per release before shifting traffic to the new API image:

```bash
pnpm --filter @audiomass/database prisma:migrate
```

Set `DATABASE_URL` to the target database for that command. Back up the database before a migration, and test both forward deployment and application rollback against a production-like snapshot. Migrations in this repository are additive; do not edit an already-applied migration.

## Storage providers

Set the common values `STORAGE_PROVIDER`, `STORAGE_BUCKET`, `STORAGE_MAX_UPLOAD_BYTES`, and `STORAGE_URL_TTL_SECONDS`, then add provider credentials:

| Provider         | Value         | Required provider variables                            |
| ---------------- | ------------- | ------------------------------------------------------ |
| AWS S3           | `s3`          | `S3_REGION`, `S3_KEY`, `S3_SECRET`                     |
| MinIO            | `minio`       | S3 variables plus `S3_ENDPOINT`                        |
| Supabase Storage | `supabase`    | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`            |
| Vercel Blob      | `vercel-blob` | `BLOB_READ_WRITE_TOKEN`, optional `VERCEL_BLOB_ACCESS` |

Use a private bucket. Allow CORS for the deployed web origin and the exact upload/download methods required by signed grants. Give the API identity access only to the configured bucket or prefix.

Add the hostnames that appear in generated input and output URLs to `PYTHON_API_ALLOWED_STORAGE_HOSTS`. S3 virtual-hosted URLs commonly include the bucket in the hostname. Supabase and Vercel may use different control-plane and object-delivery hosts; inspect real grants in staging and list every exact host. Never use a wildcard to make a failed allowlist disappear.

## Vercel web deployment

`vercel.json` builds only `@audiomass/web`. Configure the repository root as the project root, keep pnpm lockfile installation enabled, and set `NEXT_PUBLIC_API_URL` to the public NestJS `/api/v1` URL. The same-origin legacy assets live in `apps/web/public/legacy` and are included automatically.

Vercel hosts only the Next.js application in this topology. Deploy NestJS and FastAPI as containers or managed services with private networking between them.

## Security checklist

- Generate high-entropy API and internal keys; never commit deployed values.
- Terminate TLS before both public services and set an exact `CORS_ORIGINS` list.
- Keep FastAPI, PostgreSQL, and storage administration ports private.
- Restrict storage service identities and use short signed-URL TTLs.
- Keep `PYTHON_API_ALLOW_INSECURE_STORAGE=false` outside a private local stack.
- Apply CPU, memory, ephemeral-disk, and request-duration limits to Python replicas.
- Send structured logs to centralized storage and alert on readiness, 5xx rate, failed jobs, and storage verification failures.
- Scan container images and dependencies in the release pipeline.

## Rollout and rollback

Deploy in dependency order: database migration, Python service, NestJS API, then web. Validate health endpoints and a canary upload/process/download flow before full traffic. The Python contract is private, so deploy compatible Python versions before API code that requires them.

For application rollback, restore the prior image tags in reverse order. Do not automatically reverse an applied database migration; use a reviewed compensating migration or restore a verified backup when data recovery is required.
