# Third-party notices

## Removed compatibility bundles

Wave F removed the classic compatibility runtime and its bundled codec,
noise-suppression, compression, and WaveSurfer files. They are not distributed
by the current Web build. The table is retained as an attribution record for
historical source releases; new dependencies must add their own current notice.

| Historical project                     | License      |
| -------------------------------------- | ------------ |
| WaveSurfer.js 2.0.5 and regions plugin | BSD-3-Clause |
| lamejs / LAME MP3 encoder              | LGPL         |
| libFLAC 1.3.3                          | Xiph/New BSD |
| RNNoise                                | BSD-3-Clause |
| lz4-wasm                               | BSD-2-Clause |

The enterprise workspace also depends on separately distributed packages. Their
license texts remain with their published packages and container distributions.
The pnpm lockfile and `apps/python-api/requirements.txt` are the authoritative
version inventories; this file is a project-level notice, not a replacement for
the complete license text shipped by each dependency.

| Runtime project                | License                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| Next.js and React              | MIT                                                                     |
| NestJS and Fastify             | MIT                                                                     |
| Prisma ORM                     | Apache-2.0                                                              |
| PostgreSQL client for Node.js  | MIT                                                                     |
| AWS SDK for JavaScript         | Apache-2.0                                                              |
| Supabase JavaScript client     | MIT                                                                     |
| Vercel Blob SDK                | Apache-2.0                                                              |
| FastAPI, Uvicorn, and Pydantic | MIT                                                                     |
| NumPy and SciPy                | BSD-3-Clause                                                            |
| Librosa                        | ISC                                                                     |
| PySoundFile                    | BSD-3-Clause                                                            |
| pyloudnorm                     | MIT                                                                     |
| faster-whisper and CTranslate2 | MIT                                                                     |
| HTTPX/HTTPX2                   | BSD-3-Clause                                                            |
| FFmpeg                         | LGPL-2.1-or-later; optional components can change the effective license |

## Release review

Wave G reviewed this notice against the current workspace manifests after the
compatibility bundles were deleted. A release must run the dependency audits in
CI and review any newly introduced direct runtime dependency before publishing.
Dependencies with copyleft, source-offer, patent, codec, or model-license terms
require a separate distribution review; do not infer compatibility solely from
this summary table.
