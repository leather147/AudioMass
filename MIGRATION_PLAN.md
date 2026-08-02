# AudioMass Enterprise Migration Plan

> Архив исходного аудита и плана. Миграция завершена; фактическая архитектура,
> эксплуатационные контракты и последовательность коммитов описаны в `docs/`.

## Статус документа

Первая миграция инфраструктуры и перенос first-party `.js` в TypeScript
завершены. Текущая фаза не считает эти файлы современными только из-за
расширения `.ts`: IIFE, ordered scripts, globals и прямое построение DOM должны
быть заменены framework-native модулями. Исполняемый план этой фазы находится в
[`docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md`](docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md).

На текущем checkpoint созданы доменные/application-модули audio-engine,
React-controller/store и feature-компоненты Next.js, versioned project codec,
IndexedDB repository, typed recording/worklet/WAV/DSP/multitrack primitives,
ID3/MP4 metadata, typed WAV/tempo worker clients,
PCM-aware single-track history/edit commands, WAV export UI, native multitrack
mixer/routing/crossfade/bounce services, operation-specific NestJS DTO и
discriminated FastAPI job schemas, typed effect schemas и versioned preset
repository. Waves A-F завершили production promotion и удаление classic
runtime, iframe bridge, globals, copied assets и compatibility-компилятора.

- Активная ветка структурной миграции: `agent/repository-hardening`.
- Базовая версия: полнофункциональный статический AudioMass с multitrack, темами, записью, эффектами и экспортом.
- Стратегия: поэтапная миграция существующего приложения без функционального переписывания с нуля.
- Цель: production-ready Turborepo с Next.js 16, NestJS 11, FastAPI, Prisma и типизированными пакетами.
- Версия Node.js в workspace и deployment: 24.x.
- Минимальная версия Python: 3.12.

## 1. Результаты аудита

### 1.1 Репозиторий

Текущий репозиторий содержит 149 отслеживаемых файлов общим объёмом около 16.8 MB.

| Тип        | Файлов |   Строк |
| ---------- | -----: | ------: |
| JavaScript |     60 | ~47 300 |
| CSS        |     35 |  ~7 350 |
| HTML       |      7 |  ~1 160 |
| Python     |      2 |      11 |
| Go         |      1 |      40 |

Большая часть веса и логики сосредоточена в браузерных vendor/DSP-файлах: `lame.js`, `libflac.js`, WaveSurfer, RNNoise и WASM-модулях.

### 1.2 Текущая frontend-архитектура

Приложение является статической SPA без сборщика:

1. `src/index.html` последовательно подключает 30 CSS-файлов и более 35 глобальных script-файлов.
2. `src/app.js` создаёт глобальный `window.PKAudioEditor` и собственную event-bus модель.
3. `src/ui.js`, `src/ui-fx.js`, `src/modal.js` и дополнительные patch-модули напрямую изменяют DOM.
4. `src/engine.js` содержит загрузку, playback, selection, undo/redo, экспорт и большинство DSP-эффектов.
5. `src/multitrack.js` содержит отдельную крупную модель multitrack, клипы, каналы, crossfade, запись и bounce.
6. Темы и локализация работают через `theme-service.js`, `theme-registry.js`, `locale-service.js` и browser preferences.
7. Модули связаны через глобальные объекты, строковые события и порядок подключения script-тегов.

React, TypeScript, Tailwind, module bundler и server rendering отсутствуют.

### 1.3 Audio engine

Рабочая browser-first реализация уже поддерживает:

- Web Audio API и OfflineAudioContext;
- WaveSurfer waveform/regions;
- single-track и multitrack playback;
- record через `AudioWorklet` (`recorder-worklet.js`);
- gain, fade, reverse, speed/rate, normalize, compressor, reverb, delay, distortion;
- LUFS/RMS, spectral analysis, noise reduction и repair operations;
- WAV/MP3/FLAC export;
- markers, selection, zoom, undo/redo;
- LAME, libFLAC, RNNoise и LZ4 WASM;
- tempo worker и browser workers.

Проблемы:

- интерфейс движка не типизирован;
- UI, state и DSP смешаны;
- эффекты регистрируются через строковые события;
- lifecycle зависит от DOM и глобального singleton;
- тяжёлые операции выполняются в основном потоке;
- отсутствует единый cancellation/progress/error контракт.

### 1.4 Plugins

Настоящего plugin SDK нет. Эффекты являются встроенными обработчиками в `engine.js` и `ui-fx.js`. Динамическая загрузка script поддерживается, но нет:

- plugin manifest;
- registry;
- semver/version compatibility;
- capability permissions;
- lazy ESM loading;
- изолированного lifecycle;
- тестируемого контракта.

### 1.5 Backend

Прикладного backend сейчас нет.

- `src/audiomass-server.py` — только статический HTTP server.
- `src/audiomass-server.go` — статический file server с CORS и cache headers.
- Нет authentication, projects API, storage API, database, validation, logging и error envelope.
- Frontend не имеет BFF и не использует сервер для тяжёлых задач.

### 1.6 Python

Корневой `main.py` печатает приветствие. Текущий `pyproject.toml` не содержит зависимостей и ошибочно требует Python 3.14. Вычислительного Python-кода нет.

### 1.7 Storage и persistence

- Preferences, theme, locale и custom effect presets сохраняются в `localStorage`.
- Draft sessions сохраняются в IndexedDB через `local.js`.
- Cloud storage отсутствует.
- Database отсутствует.
- Для production-проектов локальное хранение должно быть заменено API-backed persistence; device preferences могут оставаться локальными.

### 1.8 Build, deployment и quality

- В `src/package.json` есть только dependency `serve`; scripts отсутствуют.
- Production build описан в README как ручная конкатенация и uglify.
- `vercel.json` публикует каталог `src` как статику.
- Service Worker вручную перечисляет assets.
- CI отсутствует.
- Автоматических тестов нет.
- ESLint, Prettier, strict TypeScript, Husky и lint-staged отсутствуют.
- Python lint/type/test tooling отсутствует.
- Docker-конфигураций backend-сервисов нет.

## 2. Проблемы, которые устраняет миграция

1. Глобальное изменяемое состояние и неявный порядок загрузки.
2. Монолитные файлы UI/engine/multitrack.
3. Отсутствие типизированных границ между UI, audio и backend.
4. Невозможность независимо тестировать DSP и plugins.
5. Отсутствие production persistence и cloud storage.
6. Отсутствие API Gateway между браузером и Python.
7. Отсутствие наблюдаемости, validation и устойчивого error handling.
8. Ручной deployment и отсутствие воспроизводимого build.
9. Невозможность безопасно модернизировать UI без регрессий audio-функций.

## 3. Целевая структура

```text
apps/
  web/          Next.js 16 App Router + React 19 + Tailwind
  api/          NestJS 11 BFF/API Gateway
  python-api/   FastAPI compute service
packages/
  audio-engine/ TypeScript Web Audio engine, DSP, workers and domain modules
  plugin-sdk/   Plugin contracts, registry and lazy loader
  shared/       DTO, result/error and domain contracts
  ui/           Shared React UI primitives
  config/       Shared TypeScript, ESLint and environment config
  database/     Prisma schema and generated client
tooling/        Repository scripts and OpenAPI generation
docs/           Architecture, deployment and completed migration notes
```

## 4. Архитектурная стратегия

### 4.1 Сохранение функциональности

Миграция была выполнена через production strangler pattern:

1. Исходный browser runtime был перенесён с сохранением Git history и поведения.
2. Промежуточные Next.js routes `/editor` и `/editor-runtime` предоставили same-origin границу без статического HTML entrypoint.
3. Интерактивные browser audio функции продолжают выполняться локально без сетевого round-trip.
4. На parity-этапе Next.js shell и editor использовали типизированный `postMessage` bridge с проверкой origin и payload.
5. Нативные React/controller/audio-engine модули заменили DOM builders, globals, ordered scripts и runtime assets.
6. Wave F удалил `/editor-runtime`, iframe bridge, 116 runtime-файлов, generated `public/editor-assets`, classic tool hosts и build/config exceptions.

Production `/editor` теперь является единственной композицией редактора. Next.js
управляет routing, settings, PWA metadata, redirects, error boundaries и
deployment; React и audio-engine владеют editor behavior.

### 4.2 Frontend

`apps/web` использует:

- App Router;
- Server Components для shell, projects и plugin catalog;
- Client Components для editor interaction и Web Audio lifecycle;
- Server Actions для безопасных settings/project mutations;
- Tailwind для нового shell и shared UI;
- CSS Modules и semantic theme tokens для editor presentation;
- Next.js headers для AudioWorklet/WASM и SharedArrayBuffer;
- typed BFF client; прямые обращения к FastAPI запрещены.

Маршруты:

- `/` — product/dashboard;
- `/editor` — AudioMass editor;
- `/plugins` — plugin registry;
- `/settings` — environment/user settings;
- `/api/health` — frontend health facade.

### 4.3 Browser audio engine

`packages/audio-engine` получает публичный контракт:

```ts
interface AudioEngine {
  load(file: File): Promise<AudioTrack>;
  play(): void;
  pause(): void;
  applyEffect(effect: AudioEffect): Promise<void>;
  export(format: string): Promise<Blob>;
}
```

Дополнительно реализуются:

- explicit lifecycle/dispose;
- progress and cancellation;
- typed errors;
- AudioWorklet transport;
- worker protocol;
- WAV encoder без server dependency;
- typed controller/session adapters без browser globals;
- capability detection для SharedArrayBuffer/WASM.

### 4.4 Plugin SDK

`packages/plugin-sdk` реализует:

- `AudioPlugin` и `PluginContext`;
- manifest schema;
- registry и duplicate protection;
- semantic version compatibility;
- lazy ESM loading;
- enable/disable lifecycle;
- capability declaration;
- deterministic processing contract;
- unit tests.

### 4.5 NestJS BFF

`apps/api` — единственная server API точка для frontend.

Модули:

- `audio` — jobs, metadata, analyze/process facade;
- `files` — upload/download/presigned URLs;
- `plugins` — catalog и remote execution;
- `users` — user profile boundary;
- `storage` — S3/MinIO/Supabase/Vercel Blob adapters;
- `python` — typed FastAPI client;
- `projects` — project CRUD и asset relations.

Общие возможности:

- global ValidationPipe;
- structured logging;
- request id;
- uniform error envelope;
- DTO/OpenAPI;
- health/readiness endpoints;
- configurable standard bootstrap для self-hosted Node;
- экспорт app factory для serverless adapter без обязательного `app.listen()`.

### 4.6 FastAPI

`apps/python-api` выполняет только тяжёлые операции:

- metadata/spectrum/LUFS analysis;
- normalize, reverb и noise reduction;
- format conversion/export через soundfile/FFmpeg;
- pitch и beat detection;
- plugin execution;
- transcription provider boundary.

Каждый endpoint работает с реальным uploaded audio или storage reference, возвращает typed schema и не содержит placeholder response. OpenAPI доступен на `/openapi.json`.

### 4.7 Database и storage

Prisma/PostgreSQL models:

- User;
- Project;
- AudioAsset;
- ProjectTrack;
- Plugin;
- ProcessingJob.

Production storage выбирается через environment:

- S3 / MinIO;
- Supabase Storage;
- Vercel Blob.

IndexedDB остаётся только как offline cache/device draft и не является authoritative production storage.

## 5. Карта переноса

| Исходная область          | Итоговый владелец                           | Результат Wave F                                      |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `src/index.html` и assets | Next.js App Router                          | Runtime route и copied asset tree удалены             |
| `app.js` event bus        | React store + typed controller events       | Globals и message bridge удалены                      |
| `engine.js`               | `packages/audio-engine`                     | Transport, edits, effects и export типизированы       |
| `multitrack.js`           | `packages/audio-engine/multitrack` + React  | Domain/mixer/bounce и UI работают без host adapter    |
| `ui.js`, `ui-fx.js`       | `apps/web/features/editor`                  | DOM builders заменены React-компонентами              |
| `recorder-worklet.js`     | `packages/audio-engine`                     | Protocol и lifecycle типизированы                     |
| `tempo-worker.js`         | `packages/audio-engine`                     | ESM worker и discriminated messages                   |
| Старые vendor bundles     | удалены                                     | Unreachable gateway/assets удалены, notices сохранены |
| `local.js`                | IndexedDB repositories + server storage API | Локальные документы и cloud contracts разделены       |
| static servers            | Next/Nest/FastAPI                           | Старые entrypoints удалены                            |
| root Python placeholder   | `apps/python-api`                           | Реализован FastAPI service                            |

## 6. Этапы и коммиты

1. `chore: initialize turborepo workspace`
   - audit plan, root workspace, shared config, CI-ready scripts.
2. `feat(web): migrate AudioMass UI to Next.js 16`
   - Next shell, editor boundary, routes, перенесённые legacy assets.
3. `feat(audio): extract browser audio engine`

- typed engine, worklet/worker protocol, compatibility adapter.

4. `feat(plugin): create plugin sdk`
   - contracts, registry, versioning, lazy loading.
5. `feat(api): migrate backend modules to NestJS`
   - modules, DTO, validation, logging, app factory.
6. `feat(python): add FastAPI audio processing service`
   - real processing endpoints, tests, OpenAPI.
7. `feat(storage): implement cloud storage`
   - Prisma models and production storage adapters.
8. `feat(ai): integrate python processing pipeline`
   - Nest typed client, jobs, transcription/analysis orchestration.
9. `docs: add migration documentation`
   - API.md, PYTHON_API.md, deployment and operations.

## 7. Проверки на каждом этапе

- `/editor` opens and an imported audio file renders its waveform.
- Playback, pause, seek and waveform remain functional.
- Multitrack clips, channels and bounce remain functional.
- Recording worklet loads.
- WAV/MP3/FLAC export remains available.
- Themes/localization remain functional.
- No direct web-to-FastAPI requests.
- TypeScript uses `strict: true`.
- New modules have unit/integration tests.
- No committed TODO, mock production adapters or placeholder endpoints.

## 8. Финальная матрица качества

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

```bash
cd apps/python-api
pytest
ruff check .
black --check .
mypy app
```

Дополнительно:

- Prisma schema validates and client generates.
- FastAPI OpenAPI schema generates.
- Nest typed client matches committed OpenAPI schema.
- Docker images for API and Python build.
- Next.js frontend builds for Vercel.
- Nest and FastAPI start independently.
- Production environment validation rejects missing secrets.
- License notices include all migrated vendor codecs.

## 9. Риски и меры

| Риск                                     | Мера                                                            |
| ---------------------------------------- | --------------------------------------------------------------- |
| Регрессии при переписывании 47k строк JS | Завершённые strangler checkpoints и parity E2E до Wave F        |
| Browser-only API во время SSR            | `use client`, dynamic boundary и capability checks              |
| COOP/COEP ломает external assets         | Self-host assets, добавить resource policies и E2E headers test |
| WASM paths после перемещения             | Сохранять относительную структуру и проверять network failures  |
| Большие audio uploads                    | Presigned multipart storage, не проксировать payload через Next |
| FastAPI overload                         | Async job model, size limits, timeouts и cancellation           |
| OpenAPI drift                            | Schema generation в build/CI и typed client check               |
| Vendor license loss                      | Сохранить THIRD_PARTY_NOTICES и source attribution              |

## 10. Definition of Done

Миграция завершена только когда:

- текущий AudioMass editor полностью работает из Next.js `/editor`;
- каталог `apps/web/editor-runtime`, iframe bridge, `module: none` и first-party
  runtime globals удалены после прохождения parity gate;
- все три сервиса запускаются независимо;
- browser сохраняет простые audio операции;
- frontend общается с Python только через NestJS;
- production projects хранятся в PostgreSQL и cloud object storage;
- plugin SDK используется хотя бы одним реальным browser plugin;
- FastAPI выполняет реальные DSP endpoints;
- документация соответствует реальным routes;
- все команды из master prompt проходят;
- в production code нет заглушек, TODO и mock implementations.
