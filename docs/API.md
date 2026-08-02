# NestJS API

## Entry points

- Base URL: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`
- Authentication: `x-api-key: <configured key>` on every business route
- Content type: `application/json` unless the returned value is a signed URL response

API keys are comma-separated in `API_KEYS`. Each key must contain at least 32 characters. Rotate keys by temporarily configuring both old and new values, deploying, moving callers to the new key, then removing the old one.

## Health

| Method | Route           | Authentication | Purpose            |
| ------ | --------------- | -------------- | ------------------ |
| `GET`  | `/health/live`  | Public         | Process liveness   |
| `GET`  | `/health/ready` | Public         | Database readiness |

## Projects

| Method   | Route           | Purpose                        |
| -------- | --------------- | ------------------------------ |
| `POST`   | `/projects`     | Create a project               |
| `GET`    | `/projects`     | Page-based owner listing       |
| `GET`    | `/projects/:id` | Read one owner-scoped project  |
| `PATCH`  | `/projects/:id` | Update an owner-scoped project |
| `DELETE` | `/projects/:id` | Delete an owner-scoped project |

`GET`, `PATCH`, and `DELETE /projects/:id` require an `ownerId` query parameter. The project timeline is JSON and begins as an empty array. Updates increment `version`; the body must include `expectedVersion`, and a stale value returns a conflict rather than overwriting another writer.

## Processing jobs

| Method  | Route                         | Purpose                                          |
| ------- | ----------------------------- | ------------------------------------------------ |
| `POST`  | `/processing-jobs`            | Create a queued job; supports an idempotency key |
| `GET`   | `/processing-jobs`            | Filter and paginate jobs                         |
| `GET`   | `/processing-jobs/:id`        | Read one job                                     |
| `PATCH` | `/processing-jobs/:id/status` | Apply a valid progress/status transition         |
| `POST`  | `/processing-jobs/:id/cancel` | Cancel a non-terminal job                        |

The state machine is `QUEUED -> RUNNING -> SUCCEEDED | FAILED | CANCELLED`, with cancellation also allowed while queued. Progress is an integer from 0 through 100.

Processing-job routes are service-level orchestration endpoints. They do not accept an end-user identity and must be called only by a trusted server that has already authorized the referenced project. Namespace idempotency keys by tenant/workspace to avoid collisions. Do not call these routes directly from browser code.

## Cloud files

| Method   | Route                     | Purpose                                             |
| -------- | ------------------------- | --------------------------------------------------- |
| `POST`   | `/files/uploads`          | Reserve an object and create a direct-upload grant  |
| `POST`   | `/files/:id/complete`     | Verify object metadata and mark it ready            |
| `GET`    | `/files`                  | List owner-scoped objects                           |
| `GET`    | `/files/:id/download-url` | Create a short-lived download grant                 |
| `DELETE` | `/files/:id`              | Delete the cloud object and mark its record deleted |

The upload request contains `ownerId`, optional `projectId`, `fileName`, `contentType`, and `size`. File names are metadata only; the server generates the provider key. Call completion only after the provider upload succeeds.

## Python processing gateway

Every gateway route now has an operation-specific DTO. `parameters` is no
longer an untyped dictionary for analyze, normalize, export, reverb, noise
reduction, voice activity, or transcription. Nest validates ranges and enums
before reserving output storage or calling FastAPI; plugin parameters remain an
explicit extensibility boundary nested below a validated plugin identifier.

| Operation       | Validated parameters                                         |
| --------------- | ------------------------------------------------------------ |
| analyze         | empty object                                                 |
| normalize       | `target_peak_dbfs` from `-20` through `0`                    |
| export          | `output_format`: `wav`, `flac`, `mp3`, or `ogg`              |
| reverb          | `room_size`, `damping`, and `wet` from `0` through `1`       |
| noise-reduction | `strength` from `0` through `1`                              |
| voice-activity  | `sensitivity` from `0` through `1`                           |
| transcribe      | optional language plus `transcribe` or `translate` task      |
| plugin          | plugin-owned object, wrapped by the allowlisted plugin route |

Every route below accepts the same JSON envelope:

```json
{
  "ownerId": "workspace-42",
  "inputFileId": "a-ready-storage-object-uuid",
  "parameters": {},
  "outputFileName": "processed.wav",
  "idempotencyKey": "optional-stable-operation-key"
}
```

| Method | Route                             | Output                                     |
| ------ | --------------------------------- | ------------------------------------------ |
| `POST` | `/python/audio/analyze`           | JSON analysis stored on the processing job |
| `POST` | `/python/audio/normalize`         | Generated audio object                     |
| `POST` | `/python/audio/export`            | WAV, FLAC, OGG, or MP3 object              |
| `POST` | `/python/effects/reverb`          | Generated audio object                     |
| `POST` | `/python/effects/noise-reduction` | Generated audio object                     |
| `POST` | `/python/plugins/:pluginId/run`   | Generated audio from a trusted plugin      |
| `POST` | `/python/ai/voice-activity`       | JSON speech regions                        |
| `POST` | `/python/ai/transcribe`           | JSON transcript and segments               |

NestJS obtains signed storage URLs, invokes the private FastAPI job endpoint, verifies generated objects, and commits the job result. Callers never receive Python credentials or a Python service URL.

## Errors and pagination

NestJS uses standard HTTP status codes. Validation failures are `400`; missing owner-scoped resources are `404`; stale versions and duplicate unique operations are `409`; missing/invalid keys are `401`; rate limiting is `429`; an unavailable dependency is `503`.

List routes use bounded page-based pagination. Send `page` starting at `1` and `pageSize` from `1` through `100`; responses contain `items`, `page`, `pageSize`, and `total`.

## Contract ownership and verification

Controllers, DTOs, guards, and orchestration under `apps/api/src` are the source
of truth. This guide summarizes that executable contract; clients should use the
OpenAPI document served by the deployed version instead of copying tables from
documentation into handwritten validators.

From the repository root, validate the API before a release:

```bash
pnpm --filter @audiomass/database exec prisma validate
pnpm --filter @audiomass/database exec prisma generate
pnpm --filter @audiomass/api lint
pnpm --filter @audiomass/api typecheck
pnpm --filter @audiomass/api test
pnpm --filter @audiomass/api build
```

The Vercel project uses `apps/api` as its Root Directory. Its checked-in
`vercel.json` invokes `tooling/vercel-api-build.mjs`, which deploys database
migrations before building the database package and NestJS application. Review
the migration and backup plan before redeploying production; do not replace that
command with a generic framework preset.
