# Operations runbook

## Health and first response

Include these routes in Web smoke tests:

- `/editor` proves the production App Router/React/audio package boundary;
- `/editor/native` proves the compatibility redirect and validated panel query;
- `/tools/frequency-analyser`, `/tools/spectral-analyser`, and
  `/tools/multitrack-mixer` prove redirects to their native panels;
- `/manifest.webmanifest`, `/icon.svg`, and `/sw.js` prove the native PWA shell.

A failure on `/editor` usually points to Next.js chunks, browser Web Audio
support, preference parsing, or a native feature module. A redirect failure
points to an App Router route; an offline reload failure points to service-worker
registration, the manifest, or a missing same-origin resource. No runtime build
or copied editor asset tree exists after Wave F.

`/editor-runtime` is intentionally absent and must return `404`; a successful
response indicates that a stale deployment or compatibility artifact has been
revived. Browser smoke checks should also fail on console errors, framework
error overlays, unexpected application-request failures, page-level horizontal
overflow at 320 px, or an offline reload that cannot reopen `/editor`.

Monitor these endpoints from their appropriate network:

- Web: `GET /`
- NestJS liveness: `GET /api/v1/health/live`
- NestJS readiness: `GET /api/v1/health/ready`
- FastAPI liveness: `GET /health/live`
- FastAPI readiness: `GET /health/ready`

If web is healthy but editing requests fail, check NestJS readiness and browser CORS errors. If NestJS is live but not ready, test PostgreSQL connectivity and migration status. If processing alone fails, correlate the NestJS job ID and request ID with Python structured logs, then verify signed URL expiry, exact allowed hostnames, storage reachability, and output reservation state.

## Common incidents

### Upload cannot complete

Confirm the client used the returned method and headers, the URL has not expired, the object content type and byte size match the reservation, provider CORS allows the web origin, and the object exists in the configured bucket. Do not mark a pending object ready manually; completion performs the verification that protects downstream processing.

### Processing job fails immediately

Check that both services use the same `PYTHON_API_INTERNAL_KEY`, that FastAPI is reachable only at `PYTHON_API_URL`, and that the operation parameters match the OpenAPI schema. A 401 indicates key disagreement; a 422 indicates schema validation; a 429/503 usually indicates capacity or dependency pressure.

### Remote processing transfer fails

Compare the URL hostname with `PYTHON_API_ALLOWED_STORAGE_HOSTS`, check URL TTL and clock synchronization, and confirm HTTPS enforcement. For local MinIO only, confirm `PYTHON_API_ALLOW_INSECURE_STORAGE=true`. Inspect storage provider audit logs before increasing timeouts.

### Transcription latency rises

Check whether replicas repeatedly download the model, whether CPU/GPU compute type matches the node, and whether concurrency exceeds available memory. Preload or persist the Hugging Face cache, reduce the per-process concurrency limit, or schedule transcription replicas on dedicated nodes.

## Key rotation

For public API keys, add a new comma-separated value to `API_KEYS`, deploy the API, rotate callers, then remove the old value. For `PYTHON_API_INTERNAL_KEY`, deploy FastAPI with the new key immediately before deploying NestJS; use a controlled maintenance window because the internal key is singular.

Rotate storage credentials using provider-native overlapping credentials when available. Confirm new signed upload and download grants before revoking the previous identity.

## Backups and recovery

- Use automated PostgreSQL backups with point-in-time recovery and routinely test restores.
- Enable object versioning or provider retention appropriate to the data policy.
- Back up database and object storage as one logical system: the database contains object keys, not audio bytes.
- A restore drill must verify projects, processing-job history, object metadata, and a real download.

## Capacity

Track API latency, event-loop saturation, PostgreSQL pool usage, object transfer errors, Python job duration by operation, Python concurrency saturation, memory high-water marks, temp-disk use, and transcription model-cache hit rate. Scale web/API replicas on latency and CPU. Scale Python workers by operation duration and resource saturation, while keeping the per-replica semaphore aligned with node capacity.

## Data lifecycle

Storage records move through `PENDING`, `READY`, `REJECTED`, and `DELETED`. Alert on old pending objects and clean their remote counterparts with a reviewed maintenance job. Retention and tenant deletion workflows must remove both database references and underlying objects; database deletion alone does not satisfy data erasure.

## Release handoff

Record the exact Git commit and Vercel deployment IDs for Web, API, and Python.
Before promotion, require the repository release gate (`pnpm format:check`,
`pnpm docs:check`, lint, typecheck, tests, builds, Prisma, Python quality and
dependency checks), then verify the deployed health and OpenAPI endpoints. Run a
real editor import/playback/effect transaction, both locales, representative
themes, the three tool redirects, service-worker registration, and offline
reload. Keep the previous deployment addresses and database backup available
until the canary completes.
