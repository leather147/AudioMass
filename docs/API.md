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

| Method   | Route           | Purpose                              |
| -------- | --------------- | ------------------------------------ |
| `POST`   | `/projects`     | Create a project                     |
| `GET`    | `/projects`     | Cursor-paginated owner listing       |
| `GET`    | `/projects/:id` | Read one owner-scoped project        |
| `PATCH`  | `/projects/:id` | Update with an expected version      |
| `DELETE` | `/projects/:id` | Delete a project and related records |

The project timeline is JSON and begins as an empty array. Updates increment `version`; a stale expected version returns a conflict rather than overwriting another writer.

## Processing jobs

| Method  | Route                         | Purpose                                          |
| ------- | ----------------------------- | ------------------------------------------------ |
| `POST`  | `/processing-jobs`            | Create a queued job; supports an idempotency key |
| `GET`   | `/processing-jobs`            | Filter and paginate jobs                         |
| `GET`   | `/processing-jobs/:id`        | Read one job                                     |
| `PATCH` | `/processing-jobs/:id/status` | Apply a valid progress/status transition         |
| `POST`  | `/processing-jobs/:id/cancel` | Cancel a non-terminal job                        |

The state machine is `QUEUED -> RUNNING -> SUCCEEDED | FAILED | CANCELLED`, with cancellation also allowed while queued. Progress is an integer from 0 through 100.

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

List routes use bounded page sizes and cursor pagination. Treat cursors as opaque and send the returned cursor unchanged.
