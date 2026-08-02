# AudioMass Enterprise

AudioMass — браузерный многодорожечный аудиоредактор с локальным Web Audio
движком, Next.js-оболочкой, NestJS API, PostgreSQL, облачным хранилищем и
изолированным FastAPI-сервисом для тяжёлого DSP и транскрипции.

Структурная миграция browser editor и её release-документация завершены через
Wave G. Production-маршрут
`/editor` напрямую рендерит App Router/React-реализацию на
controller/store/hooks и `@audiomass/audio-engine`; `/editor/native` оставлен
только как проверяемый redirect. Classic runtime, iframe bridge, ordered script
manifest, копируемые assets, глобальные facades и runtime-компилятор удалены.
Точный план, карта модулей и отчёты этапов находятся в
[FRAMEWORK_NATIVE_EDITOR_PLAN.md](docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md).

## Текущий production

| Компонент  | Адрес                                      | Проверка               |
| ---------- | ------------------------------------------ | ---------------------- |
| Web        | <https://audio-mass-gilt.vercel.app>       | `/api/health`          |
| NestJS API | <https://audio-mass-api.vercel.app>        | `/api/v1/health/ready` |
| FastAPI    | <https://audio-mass-python-api.vercel.app> | `/health/ready`        |

Домены Vercel могут измениться при переименовании проекта или подключении
custom domain. Источником истины остаются `Settings -> Domains` каждого
Vercel Project.

## Что находится в репозитории

```text
apps/
  web/            Next.js 16, React 19, App Router editor и PWA-оболочка
  api/            NestJS 11/Fastify, OpenAPI и orchestration
  python-api/     FastAPI, DSP, export, анализ и Faster-Whisper
packages/
  audio-engine/   Web Audio, AudioWorklet, typed workers, PCM, codecs и metadata
  plugin-sdk/     типизированный lifecycle, RPC и storage плагинов
  database/       Prisma 7, PostgreSQL client, schema и migrations
  config/         общие TypeScript и ESLint-конфигурации
tooling/          безопасные clean/build/format scripts
docs/             архитектура, API, эксплуатация и подробности деплоя
```

Монорепозиторий использует pnpm workspaces и Turborepo. У приложений разные
runtime и независимые точки деплоя, но один lockfile и общие пакеты.

## Архитектура и границы доверия

```text
Browser
  -> Next.js web shell
       -> React editor features
       -> @audiomass/audio-engine / workers / AudioWorklet

Trusted server-side caller
  -> NestJS API
       -> Neon/PostgreSQL
       -> S3, MinIO, Supabase Storage или Private Vercel Blob
       -> FastAPI через внутренний ключ
            -> объектное хранилище через короткоживущие signed URLs
```

- Интерактивное воспроизведение и низколатентный DSP остаются в браузере.
- Тяжёлые операции выполняет FastAPI, не получая постоянных storage credentials.
- Браузер не должен напрямую вызывать FastAPI.
- `API_KEYS` — серверный service credential. Его нельзя помещать в
  `NEXT_PUBLIC_*` или любой клиентский bundle.
- `ownerId` ограничивает выборку ресурса, но сам по себе не подтверждает
  личность. Будущая облачная интеграция браузера должна передавать запросы через
  аутентифицированный BFF и получать `ownerId` из серверной сессии.
- Текущий редактор может работать полностью локально без облачного API.
- `packages/audio-engine` не зависит от React или backend-фреймворков: он владеет
  PCM, playback, recording, markers, history, project codec, ID3/MP4 metadata,
  typed WAV/tempo workers, immutable single-track edit transactions и
  multitrack domain. Owned PCM sources, whole-project scheduling, mixer state,
  Web Audio playback/routing, equal-power crossfades и deterministic PCM bounce
  являются importable API пакета. Native React mixer/transport, WAV export и
  полные IndexedDB-документы используют эти API без глобального runtime.
- Девять основных audio effects описаны валидируемыми discriminated schemas;
  45 встроенных пресетов используют typed values, а пользовательские пресеты
  сохраняются браузерным адаптером в versioned JSON вместо DOM-порядка и
  comma-separated строк.
- Удалённые compatibility-bundles WaveSurfer, MP3/FLAC, RNNoise и compression
  больше не входят в Web build; их исторические лицензии сохранены в
  `THIRD_PARTY_NOTICES.md`. Нативный редактор не загружает vendor globals.
- NestJS проверяет параметры каждой remote operation отдельным DTO, FastAPI —
  соответствующей discriminated Pydantic-моделью.

Подробнее: [архитектура](docs/ARCHITECTURE.md) и [NestJS API](docs/API.md).

## Требования

Для JavaScript/TypeScript-части:

- Node.js `24.x`;
- pnpm `10.12.3` через Corepack;
- Git.

Для полного локального backend:

- Python `3.13` (код поддерживает `>=3.12`);
- PostgreSQL;
- FFmpeg и `libsndfile`;
- одно поддерживаемое объектное хранилище;
- Docker Desktop с Compose — рекомендуемый способ поднять полный локальный стек.

Проверка инструментов:

```bash
node --version
corepack enable
pnpm --version
python --version
docker compose version
```

## Быстрый запуск Web без backend

Редактору не нужен backend для базовой локальной работы:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @audiomass/web dev
```

Откройте <http://localhost:3000/editor>. Настройки доступны по адресу
<http://localhost:3000/settings>.

## Полный локальный запуск через Docker Compose

Compose поднимает Web, NestJS, FastAPI, PostgreSQL и MinIO, создаёт bucket и
применяет Prisma migrations.

### 1. Установите зависимости и создайте `.env`

PowerShell:

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

macOS/Linux:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

### 2. Замените тестовые секреты

Создайте три разных значения: пароль PostgreSQL/MinIO, публичный API key и
внутренний Python key. Оба ключа должны содержать не менее 32 символов.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

В `.env` обязательно замените:

```dotenv
POSTGRES_PASSWORD=<strong-password>
S3_SECRET=<another-strong-password>
API_KEYS=<first-64-character-secret>
PYTHON_API_INTERNAL_KEY=<second-64-character-secret>
```

Не коммитьте `.env`.

### 3. Запустите стек

```bash
docker compose up --build -d
docker compose ps
```

Дождитесь healthy-состояния контейнеров и проверьте:

- Web: <http://localhost:3000/editor>;
- Web health: <http://localhost:3000/api/health>;
- API readiness: <http://localhost:4000/api/v1/health/ready>;
- Swagger: <http://localhost:4000/docs>;
- MinIO Console: <http://localhost:9001>.

FastAPI и PostgreSQL намеренно не опубликованы на host network.

Логи и остановка:

```bash
docker compose logs -f api python-api
docker compose down
```

Команда `docker compose down` сохраняет named volumes. Удаление volumes через
`down -v` уничтожит локальные данные PostgreSQL и MinIO; используйте его только
осознанно.

## Ручной локальный запуск без Compose

Этот вариант подходит, если PostgreSQL и S3-совместимое хранилище уже доступны.

### 1. Подготовьте окружение

Скопируйте `.env.example` в корневой `.env` и замените container hostnames:

```dotenv
DATABASE_URL=postgresql://audiomass:<password>@localhost:5432/audiomass
DATABASE_URL_UNPOOLED=postgresql://audiomass:<password>@localhost:5432/audiomass
PYTHON_API_URL=http://localhost:8000
S3_ENDPOINT=http://localhost:9000
PYTHON_API_ALLOWED_STORAGE_HOSTS=localhost
PYTHON_API_ALLOW_INSECURE_STORAGE=true
```

NestJS и Prisma читают единый корневой `.env`. Значения из реального process
environment имеют приоритет и используются в CI/Vercel/Docker.

### 2. Примените migrations

```bash
pnpm install --frozen-lockfile
pnpm --filter @audiomass/database prisma:migrate
```

Не редактируйте уже применённые migration-файлы. Для production сначала
сделайте backup и проверьте миграцию на копии данных.

### 3. Запустите FastAPI

PowerShell:

```powershell
Set-Location apps/python-api
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install --editable ".[dev]"
.\.venv\Scripts\python -m uvicorn app.main:app --reload --env-file ../../.env
```

macOS/Linux:

```bash
cd apps/python-api
python -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install --editable ".[dev]"
.venv/bin/python -m uvicorn app.main:app --reload --env-file ../../.env
```

Проверьте <http://localhost:8000/health/ready>. Поле `ffmpeg_available` должно
быть `true` для export/transcoding.

### 4. Запустите TypeScript-приложения

Из корня репозитория в другом терминале:

```bash
pnpm dev
```

Или отдельно:

```bash
pnpm --filter @audiomass/api dev
pnpm --filter @audiomass/web dev
```

## Основные команды

| Команда                             | Назначение                                      |
| ----------------------------------- | ----------------------------------------------- |
| `pnpm dev`                          | development watch для workspace-пакетов         |
| `pnpm build`                        | production build всех приложений и пакетов      |
| `pnpm lint`                         | ESLint без допустимых warnings                  |
| `pnpm typecheck`                    | строгая TypeScript-проверка                     |
| `pnpm test`                         | Vitest во всех JS/TS workspace-пакетах          |
| `pnpm format`                       | форматирование поддерживаемых исходников        |
| `pnpm format:check`                 | проверка форматирования без записи              |
| `pnpm docs:check`                   | проверка набора документов и локальных ссылок   |
| `pnpm clean`                        | удаление только известных build/cache artifacts |
| `pnpm audit --audit-level moderate` | аудит npm-зависимостей                          |

Python-проверки:

```bash
cd apps/python-api
black --check app tests
ruff check app tests
mypy app
pytest
pip-audit -r requirements.txt
```

CI выполняет frozen install, npm/Python dependency audit, форматирование,
проверку документации, lint, typecheck, тесты и production build. Workflow
находится в `.github/workflows/ci.yml`.

# Полный деплой только через Vercel

Для сохранения всей структуры нужны **три отдельных Vercel Project из одного
GitHub-репозитория**. Нельзя направлять один проект на корень и ожидать, что
Vercel одновременно определит Next.js, NestJS и FastAPI.

## Шаг 0. Подготовьте GitHub-ветку

Production deploy должен отслеживать ветку `production`. Сначала отправьте
feature-ветку, дождитесь зелёного CI, создайте Pull Request и слейте его в
`production`.

```bash
git fetch origin
git rebase origin/production
git push -u origin <feature-branch>
```

Если `origin` возвращает `403`, у аккаунта нет write-доступа. Отправьте ветку в
свой fork и откройте PR в `leather147/AudioMass`:

```bash
git push -u fork <feature-branch>
```

Если push отклонён как `fetch first`, не используйте force вслепую:

```bash
git fetch origin
git rebase origin/<feature-branch>
git push origin <feature-branch>
```

Разрешите конфликты, повторно выполните проверки и только затем push.

## Шаг 1. Создайте три Vercel Project

В Vercel нажмите `Add New -> Project`, импортируйте один и тот же GitHub repo
три раза и задайте параметры:

| Vercel Project          | Root Directory    | Framework | Production Branch |
| ----------------------- | ----------------- | --------- | ----------------- |
| `audio-mass`            | `apps/web`        | Next.js   | `production`      |
| `audio-mass-api`        | `apps/api`        | NestJS    | `production`      |
| `audio-mass-python-api` | `apps/python-api` | FastAPI   | `production`      |

Для каждого проекта:

1. Откройте `Settings -> Build and Deployment`.
2. Проверьте Root Directory из таблицы.
3. Включите `Include files outside the root directory in the Build Step`.
4. Не задавайте Output Directory вручную.
5. Для Web и API выберите Node.js `24.x`.
6. Регион оставьте `Washington, D.C., USA (East) — iad1`.
7. В `Settings -> Environments -> Production -> Branch Tracking` выберите
   `production`.

Репозиторий уже содержит отдельные `vercel.json`:

- Web определяет Next.js и `iad1`;
- API запускает `tooling/vercel-api-build.mjs`, migrations и Nest build;
- Python использует FastAPI, Fluid Compute, `maxDuration: 300` и корректный
  install в `.vercel/python/.venv`.

Не переопределяйте Python Install Command. Нужная команда уже записана в
`apps/python-api/vercel.json`:

```text
uv pip install --python .vercel/python/.venv -r requirements.txt
```

## Шаг 2. Подключите Neon Postgres к API

Все действия выполняйте внутри `audio-mass-api`:

1. Откройте `Storage`.
2. Нажмите `Create Database`.
3. Выберите `Neon — Serverless Postgres`.
4. Выберите регион `iad1`.
5. Отключите Neon Auth — приложение использует свою server-side границу.
6. Назовите ресурс `audiomass-neon`.
7. Подключите его к Production, Preview и Development окружениям API.

Проверьте созданные переменные:

- `DATABASE_URL` — pooled URL для runtime;
- `DATABASE_URL_UNPOOLED` — direct URL для `prisma migrate deploy`.

Если direct URL не добавлен автоматически, включите его в настройках Neon.
Для Preview Deployments можно включить отдельные Neon database branches, чтобы
feature-ветки не применяли migrations к production-базе.

## Шаг 3. Создайте Private Vercel Blob

В `audio-mass-api`:

1. Откройте `Storage -> Create`.
2. Выберите `Blob`.
3. Назовите ресурс `audiomass-blob`.
4. Выберите Access `Private` до создания — позже тип доступа не меняется.
5. Выберите регион `iad1`.
6. Подключите Blob к Production, Preview и Development API-окружениям.

Vercel добавит `BLOB_READ_WRITE_TOKEN`. Токен должен существовать только в
API-проекте.

Скопируйте hostname приватного Blob URL без протокола и пути:

```text
<store-id>.private.blob.vercel-storage.com
```

Он понадобится точному allowlist FastAPI.

## Шаг 4. Сгенерируйте секреты

Сгенерируйте два разных 64-символьных секрета:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

- первый — `API_KEYS` только для NestJS API;
- второй — одинаковый `PYTHON_API_INTERNAL_KEY` для NestJS и FastAPI.

Секреты нельзя добавлять в Git, Build Logs, Web project или переменные с
префиксом `NEXT_PUBLIC_`.

## Шаг 5. Настройте переменные `audio-mass-python-api`

Откройте `Settings -> Environment Variables` и добавьте значения в Production;
при необходимости повторите для Preview.

| Переменная                          | Рекомендуемое значение для Vercel |
| ----------------------------------- | --------------------------------- |
| `PYTHON_API_INTERNAL_KEY`           | второй секрет из шага 4           |
| `PYTHON_API_ALLOWED_STORAGE_HOSTS`  | точный hostname Private Blob      |
| `PYTHON_API_ALLOW_INSECURE_STORAGE` | `false`                           |
| `PYTHON_API_REMOTE_TIMEOUT_SECONDS` | `285`                             |
| `PYTHON_API_MAX_CONCURRENT_JOBS`    | `1`                               |
| `PYTHON_API_MAX_UPLOAD_BYTES`       | `104857600`                       |
| `PYTHON_API_LOG_LEVEL`              | `INFO`                            |
| `PYTHON_API_WHISPER_MODEL`          | `tiny` для Hobby                  |
| `PYTHON_API_WHISPER_DEVICE`         | `cpu`                             |
| `PYTHON_API_WHISPER_COMPUTE_TYPE`   | `int8`                            |
| `HF_HOME`                           | `/tmp/huggingface`                |
| `NUMBA_CACHE_DIR`                   | `/tmp/numba`                      |
| `VERCEL_SUPPORT_LARGE_FUNCTIONS`    | `1`                               |

Запустите Deploy/Redeploy Python-проекта. После появления домена проверьте:

```text
https://<python-domain>/health/live
https://<python-domain>/health/ready
```

Readiness должен вернуть `status: ok` и `ffmpeg_available: true`.

## Шаг 6. Настройте переменные `audio-mass-api`

| Переменная                 | Значение                                    |
| -------------------------- | ------------------------------------------- |
| `DATABASE_URL`             | pooled URL, созданный Neon                  |
| `DATABASE_URL_UNPOOLED`    | direct URL, созданный Neon                  |
| `API_KEYS`                 | первый секрет из шага 4                     |
| `CORS_ORIGINS`             | точные Web origins через запятую, без путей |
| `PYTHON_API_URL`           | `https://<python-domain>`                   |
| `PYTHON_API_INTERNAL_KEY`  | второй секрет из шага 4                     |
| `PYTHON_API_TIMEOUT_MS`    | `290000`                                    |
| `STORAGE_PROVIDER`         | `vercel-blob`                               |
| `STORAGE_BUCKET`           | `audiomass-blob`                            |
| `STORAGE_URL_TTL_SECONDS`  | `900`                                       |
| `STORAGE_MAX_UPLOAD_BYTES` | `104857600`                                 |
| `BLOB_READ_WRITE_TOKEN`    | автоматически создан Vercel Blob            |
| `VERCEL_BLOB_ACCESS`       | `private`                                   |

Пример CORS:

```text
https://audio-mass-gilt.vercel.app,https://preview-example.vercel.app
```

Wildcard `*`, URL с path/query/hash и не-HTTP(S) значения намеренно отклоняются
при старте API.

Не добавляйте S3/MinIO/Supabase credentials при
`STORAGE_PROVIDER=vercel-blob`.

Запустите Deploy/Redeploy API. Build script сначала выполняет
`prisma migrate deploy`, затем собирает database package и NestJS. Проверьте:

```text
https://<api-domain>/api/v1/health/live
https://<api-domain>/api/v1/health/ready
https://<api-domain>/docs
```

`live` проверяет процесс, `ready` дополнительно проверяет соединение с Neon.

## Шаг 7. Настройте и разверните `audio-mass`

Web работает без backend variables. Если серверная интеграция использует
публичный URL API, допустима только переменная:

| Переменная            | Пример                                     |
| --------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://audio-mass-api.vercel.app/api/v1` |

Не создавайте `NEXT_PUBLIC_API_KEY`: это немедленно раскроет секрет каждому
пользователю.

Запустите Preview Deployment, затем проверьте:

1. `/editor` загружает исходный редактор;
2. импорт и drag-and-drop аудио;
3. playback, zoom, waveform и multitrack mixer;
4. эффекты и popup-окна;
5. все темы и обе локализации;
6. отсутствие ошибок в Browser Console;
7. `/api/health` возвращает `status: ok`.

После успешного Preview слейте ветку в `production` или Promote deployment.

## Шаг 8. Финальная smoke-проверка

PowerShell:

```powershell
Invoke-RestMethod https://<web-domain>/api/health
Invoke-RestMethod https://<api-domain>/api/v1/health/ready
Invoke-RestMethod https://<python-domain>/health/ready
```

Проверьте в Vercel:

- все три проекта смотрят на правильные Root Directory;
- production branch — `production`;
- Neon и Blob подключены только к API;
- Prisma migration завершилась в API Build Logs;
- internal key совпадает в API и Python;
- Blob hostname в Python указан точно, без wildcard;
- секреты отсутствуют в Web;
- Preview Protection не блокирует необходимые server-to-server запросы;
- custom domains не назначены другому Vercel Project.

## Ограничения Vercel-only схемы

- На Hobby Fluid Function имеет ограничение по времени; операции должны
  укладываться в `300` секунд.
- Большие аудиофайлы нельзя проксировать через body Vercel Function. Поэтому
  проект использует direct upload и signed URLs.
- Python DSP/Whisper может потребовать Large Functions; без него bundle или
  память могут превысить лимит тарифа.
- `/tmp` и model cache непостоянны. Cold start может повторно скачать модель.
- Для Hobby используйте Whisper `tiny`, concurrency `1` и файлы до 100 MB.
- Для многочасовых задач, постоянного ML cache или GPU обычной Vercel Function
  недостаточно; контракт FastAPI придётся перенести на worker runtime.

## Типовые ошибки Vercel

### `No Next.js version detected`

Vercel смотрит на неправильный package root. Установите Root Directory
`apps/web`, Framework `Next.js` и включите files outside root. Не добавляйте
`next` в корневой `package.json` ради обхода ошибки.

### Prisma client отсутствует или таблиц нет

Проверьте обе Neon URL, доступность `DATABASE_URL_UNPOOLED` во время Build и лог
`prisma migrate deploy`. Затем Redeploy API без старого build cache.

### FastAPI собрался, но импорт DSP падает

Не заменяйте Python Install Command на `pip install --system`. Используйте
команду из `apps/python-api/vercel.json`, включите Large Functions и проверьте
Python build logs. FFmpeg предоставляется через `imageio-ffmpeg`.

### API отвечает 401

Для business route нужен `x-api-key`. Health routes публичны. Не пытайтесь
исправить 401 публикацией ключа в браузере — запрос должен идти от доверенного
server-side caller.

### CORS блокирует запрос

Добавьте точный Web origin в `CORS_ORIGINS`: протокол, hostname и при
необходимости port, без пути. После изменения Redeploy API.

### FastAPI не может скачать Blob

Сверьте hostname signed URL с `PYTHON_API_ALLOWED_STORAGE_HOSTS`, Private Blob
access, срок URL и одинаковый internal key. Не отключайте HTTPS и не ставьте
wildcard в production.

### Deployment открывает «не тот» интерфейс

Проверьте Git commit, Branch Tracking, Root Directory и домен конкретного
Vercel Project. Для этой монорепы правильный Web root — `apps/web`; старый
статический root-деплой не соответствует текущей структуре.

## Правила разработки browser editor

Production-редактор находится в `apps/web/features/editor` и
`packages/audio-engine`. React владеет доступной структурой и interaction,
контроллеры — application-командами, audio-engine — PCM/Web Audio/DSP/workers,
а App Router — route state, settings, metadata и redirects.

Нативные анализаторы, микшер, меню, About, темы и локализация принадлежат App
Router и React feature-модулям. `/api/editor-preferences` сохраняет валидированные
cookie-настройки; production UI не использует iframe, runtime globals или старые
HTML-страницы. `/tools/*` URL существуют только как серверные redirects на
зарегистрированные панели `/editor?panel=...`.

- Не возвращайте `PKAudioEditor`, `PKAudioFX`, `module: none`, ordered scripts,
  runtime manifests или прямое построение DOM.
- Общие цвета меняйте через theme tokens; не добавляйте новые hardcoded popup
  backgrounds.
- Локализацию production UI добавляйте через `apps/web/lib/editor-copy.ts`, без
  параллельных словарей и прямого `localStorage + reload` в UI-модулях.
- После UI-изменений вручную проверьте пустой проект, загруженный multitrack,
  широкий и узкий viewport, zoom браузера, темы, popup-окна и обе локали.
- Генерируемые `.next`, `dist`, coverage, Prisma client и Python caches не
  коммитятся.

## API, данные и безопасность

- Business API: `/api/v1`, авторизация заголовком `x-api-key`.
- Project `GET/PATCH/DELETE` требуют query `ownerId`; update также требует
  `expectedVersion` в body.
- Списки используют page-based pagination: `page`, `pageSize` до `100`.
- Storage object проходит состояния `PENDING -> READY/REJECTED -> DELETED`.
- Ключ объекта генерирует сервер; имя файла считается только metadata.
- Upload/download grants короткоживущие; storage credentials не уходят клиенту.
- FastAPI принимает только точный internal key и разрешённые storage hostnames.
- Перед production migration нужен backup и проверенный rollback-план.

## Документация

- [Архитектура](docs/ARCHITECTURE.md)
- [NestJS API](docs/API.md)
- [FastAPI](docs/PYTHON_API.md)
- [Общий deployment](docs/DEPLOYMENT.md)
- [Vercel + Neon + Private Blob](docs/VERCEL_ONLY_DEPLOYMENT.md)
- [Operations runbook](docs/OPERATIONS.md)
- [Migration record](docs/MIGRATION.md)
- [Финальный framework-native план и отчёты Waves A–G](docs/FRAMEWORK_NATIVE_EDITOR_PLAN.md)
- [Архив TypeScript-переписи удалённого runtime](docs/EDITOR_RUNTIME_REWRITE.md)
- [Исходный migration audit](MIGRATION_PLAN.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Лицензия

Исходный код AudioMass распространяется по MIT License. Сторонние компоненты
сохраняют собственные лицензии — см. [LICENSE](LICENSE) и
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
