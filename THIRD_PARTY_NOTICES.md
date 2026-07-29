# Third-party notices

## Editor migration note

The framework-native rewrite does not relicense or silently rewrite codec and
waveform vendors. The temporary compatibility runtime still contains the eight
allowlisted generated/vendor assets documented in
[`docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md`](docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md).
They must remain isolated behind typed adapters, keep their upstream notices,
and may be deleted only when an equivalent licensed ESM dependency or tested
adapter preserves the existing import/export behavior.

The bundled third-party files keep their own licenses. File paths in the table
below are relative to `apps/web/editor-runtime/static`.

| Project                                | Files                                                        | License      |
| -------------------------------------- | ------------------------------------------------------------ | ------------ |
| WaveSurfer.js 2.0.5 and regions plugin | `dist/wavesurfer.js`, `dist/plugin/wavesurfer.regions.js`    | BSD-3-Clause |
| lamejs / LAME MP3 encoder              | `lame.js`                                                    | LGPL         |
| libFLAC 1.3.3                          | `flac.js`, `flac.min.js`, `libflac.js`, `libflac.wasm`       | Xiph/New BSD |
| RNNoise                                | `rnn_denoise.js`, `rnn_denoise.wasm`                         | BSD-3-Clause |
| lz4-wasm                               | `lzma.js`, `lz4-block-codec-wasm.js`, `lz4-block-codec.wasm` | BSD-2-Clause |

The enterprise workspace also depends on separately distributed packages. Their license texts
remain with their published packages and container distributions.

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
