# FastAPI processing service

## Trust boundary

FastAPI is a private workload service. Do not expose port 8000 through a public load balancer. NestJS is its only intended caller.

- OpenAPI: `/openapi.json`
- Interactive docs: `/docs`
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`
- Protected routes: `x-internal-api-key: <PYTHON_API_INTERNAL_KEY>`
- Correlation: optional `x-request-id`, generated when absent

The internal key must contain at least 32 characters. Remote URLs must use HTTPS unless `PYTHON_API_ALLOW_INSECURE_STORAGE=true` is explicitly set for a trusted local network. Every hostname must be listed exactly in `PYTHON_API_ALLOWED_STORAGE_HOSTS`.

## Direct processing routes

Direct routes accept bounded multipart audio and are useful for controlled service diagnostics:

| Method | Route                         | Result                                                                   |
| ------ | ----------------------------- | ------------------------------------------------------------------------ |
| `POST` | `/v1/audio/analyze`           | Duration, sample rate, channels, peaks, RMS, loudness, and spectral data |
| `POST` | `/v1/audio/normalize`         | Loudness-normalized audio                                                |
| `POST` | `/v1/audio/export`            | Converted WAV, FLAC, OGG, or MP3                                         |
| `POST` | `/v1/effects/reverb`          | Convolution-style generated reverb                                       |
| `POST` | `/v1/effects/noise-reduction` | Chunked noise-gate reduction                                             |
| `GET`  | `/v1/plugins`                 | Trusted installed plugin manifests                                       |
| `POST` | `/v1/plugins/:pluginId/run`   | Trusted plugin output                                                    |
| `POST` | `/v1/ai/voice-activity`       | Energy-based speech regions                                              |
| `POST` | `/v1/ai/transcribe`           | Faster-Whisper transcript and timed segments                             |

MP3 export uses FFmpeg. WAV/FLAC/OGG processing uses SoundFile. Transcription downloads the configured Faster-Whisper model on first use unless model artifacts are preloaded in the container cache.

## Presigned job execution

`POST /v1/jobs/execute` accepts a Pydantic discriminated union keyed by
`operation`. Each variant owns its parameter model and whether an output upload
grant is required. Unknown parameter fields are forbidden. Code outside FastAPI
request injection can use `parse_remote_job_request`; services receive an
already narrowed model and do not parse generic dictionaries again.

The current variants are analyze, normalize, export, reverb, noise reduction,
plugin, voice activity, and transcription. Only audio-producing variants accept
`output`; metadata variants reject it. The response result is likewise limited
to typed analysis, VAD, transcription, or audio-output metadata models.

`POST /v1/jobs/execute` is the production integration endpoint. It accepts an operation, a signed input URL, an optional signed output URL, content metadata, and operation parameters. Supported operations are constrained by the execution registry; request data cannot import modules or execute source code.

The service:

1. validates URL schemes and exact hosts;
2. streams the input with a byte cap and timeout;
3. writes only into a per-request temporary directory;
4. executes under a process-local concurrency semaphore;
5. streams generated content to the signed output URL;
6. deletes temporary input and output on every exit path.

Analysis, voice activity, and transcription return JSON results. Audio-generating operations also return content type and exact byte size so NestJS can verify the reserved output object.

## Configuration

| Variable                            | Required | Meaning                                                   |
| ----------------------------------- | -------- | --------------------------------------------------------- |
| `PYTHON_API_INTERNAL_KEY`           | Yes      | Shared NestJS-to-Python secret, minimum 32 characters     |
| `PYTHON_API_ALLOWED_STORAGE_HOSTS`  | Yes      | Comma-separated exact signed-URL hostnames                |
| `PYTHON_API_ALLOW_INSECURE_STORAGE` | No       | Permit HTTP only for local/private storage; default false |
| `PYTHON_API_REMOTE_TIMEOUT_SECONDS` | No       | Remote transfer timeout; default 900                      |
| `PYTHON_API_MAX_CONCURRENT_JOBS`    | No       | Per-process execution limit; default 2                    |
| `PYTHON_API_MAX_UPLOAD_BYTES`       | No       | Multipart and remote input cap; default 512 MiB           |
| `PYTHON_API_LOG_LEVEL`              | No       | Structured application log threshold                      |
| `PYTHON_API_WHISPER_MODEL`          | No       | Faster-Whisper model name or local path; default `small`  |
| `PYTHON_API_WHISPER_DEVICE`         | No       | `cpu`, `cuda`, or supported CTranslate2 device            |
| `PYTHON_API_WHISPER_COMPUTE_TYPE`   | No       | CTranslate2 compute type; default `int8`                  |

## Local quality commands

From `apps/python-api` with the development extra installed:

```bash
black --check app tests
ruff check app tests
mypy app
pytest
python -m pip check
python -m pip_audit -r requirements.txt
```

The test suite enforces at least 85% line coverage for the Python application.

## Contract and deployment verification

Pydantic request/response models and the operation registry under
`apps/python-api/app` are the source of truth. The test suite creates the ASGI
application, validates `/openapi.json`, checks authentication and remote-storage
boundaries, and exercises real audio fixtures. After deployment, compare the
published schema and readiness response with the same release commit:

```text
GET /openapi.json
GET /health/live
GET /health/ready
```

The Vercel project Root Directory is `apps/python-api`. Its `vercel.json` uses
the FastAPI framework preset, installs `requirements.txt` into Vercel's managed
Python virtual environment, enables Fluid compute, and caps the function at 300
seconds. This does not remove Vercel body, memory, temporary-storage, or model
cold-start limits; production audio continues to move through signed object
URLs rather than large function request bodies.
