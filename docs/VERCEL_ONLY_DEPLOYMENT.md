# Развёртывание AudioMass только в Vercel

Эта схема сохраняет монорепозиторий и разделяет его на три Vercel Project. База данных работает в Neon Postgres из Vercel Marketplace, файлы — в Private Vercel Blob. Docker, VPS, Render, Railway и GitHub Actions для деплоя не нужны.

```text
Browser
  -> audio-mass (Next.js, apps/web)
  -> audio-mass-api (NestJS, apps/api)
       -> audiomass-neon (Neon Postgres)
       -> audiomass-blob (Private Vercel Blob)
       -> audio-mass-python-api (FastAPI, apps/python-api)
            -> signed URLs in audiomass-blob
```

Не объединяйте три приложения в один Vercel Project. У каждого приложения свой runtime, корень, домен, набор секретов и жизненный цикл.

## 1. Состояние проектов Vercel

Создайте три проекта из одного GitHub-репозитория `leather147/AudioMass`.

| Vercel Project          | Framework | Root Directory    | Production Branch                           |
| ----------------------- | --------- | ----------------- | ------------------------------------------- |
| `audio-mass`            | Next.js   | `apps/web`        | `production` или выбранная стабильная ветка |
| `audio-mass-api`        | NestJS    | `apps/api`        | `agent/enterprise-migration` до слияния     |
| `audio-mass-python-api` | FastAPI   | `apps/python-api` | `agent/enterprise-migration` до слияния     |

Для каждого проекта откройте `Settings -> Build and Deployment`:

1. Установите указанный `Root Directory`.
2. Оставьте `Include files outside the root directory in the Build Step` включённым. Это обязательно для pnpm workspace и общих пакетов.
3. Выберите Node.js `24.x` для Web и API.
4. Не задавайте `Output Directory` вручную.
5. Не переопределяйте Install Command. Vercel найдёт корневой `pnpm-lock.yaml` и `pnpm-workspace.yaml`.

Затем откройте `Settings -> Environments -> Production -> Branch Tracking` и выберите ветку, которая реально содержит каталоги `apps/*`. До слияния миграции это `agent/enterprise-migration`.

Файлы `vercel.json` уже находятся в корнях приложений. Они фиксируют framework preset, регион `iad1`, Fluid Compute и максимальную длительность API Functions 300 секунд.

## 2. Создание Neon в Vercel

Все действия выполняются в проекте `audio-mass-api`:

1. Откройте `Storage`.
2. Нажмите `Create Database`.
3. Выберите `Neon — Serverless Postgres`.
4. Регион: `Washington, D.C., USA (East) — iad1`. Он совпадает с регионом API Functions.
5. `Auth` отключите: приложение не использует Neon Auth.
6. Выберите план `Free`, если его лимитов достаточно.
7. Имя ресурса: `audiomass-neon`.
8. Создайте ресурс и подключите его к `Production`, `Preview` и `Development` окружениям API-проекта.

После создания откройте настройки ресурса Neon и проверьте переменные:

- `DATABASE_URL` — pooled connection string. Его использует NestJS/Prisma во время запросов.
- `DATABASE_URL_UNPOOLED` — direct connection string. Его использует `prisma migrate deploy` во время сборки.

Если интеграция создала только `DATABASE_URL`, включите `DATABASE_URL_UNPOOLED` в настройках переменных Neon. Конфигурация Prisma сначала выбирает direct URL, затем безопасно откатывается к `DATABASE_URL`.

Для Preview включите `Create a database branch for deployment -> Preview`, если интерфейс Neon предлагает эту настройку. Тогда каждый Preview Deployment получает изолированную ветку базы, а миграции применяются к ней автоматически.

## 3. Создание Private Vercel Blob

В проекте `audio-mass-api`:

1. Откройте `Storage -> Create Database`.
2. Выберите `Blob`.
3. Имя: `audiomass-blob`.
4. Access: `Private`. Режим доступа нельзя поменять после создания.
5. Регион: `iad1`.
6. Подключите Blob к `Production`, `Preview` и `Development` API-проекта.

Vercel автоматически добавит `BLOB_READ_WRITE_TOKEN`. Не копируйте этот токен в Web и не создавайте для него переменную `NEXT_PUBLIC_*`.

Private Blob URL имеет вид:

```text
https://<store-id>.private.blob.vercel-storage.com/<pathname>
```

Скопируйте только hostname без `https://` и пути. Он понадобится FastAPI как точный allowlist, например:

```text
abc123.private.blob.vercel-storage.com
```

## 4. Секреты

Сгенерируйте два разных случайных секрета длиной не менее 32 символов. Например, локально:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Первый сохраните как `API_KEYS` только в `audio-mass-api`. Второй сохраните под одним и тем же именем `PYTHON_API_INTERNAL_KEY` в `audio-mass-api` и `audio-mass-python-api`.

Никогда не добавляйте эти значения в Git, Build Logs, `NEXT_PUBLIC_*` или клиентский JavaScript.

## 5. Environment Variables

Добавляйте значения в `Settings -> Environment Variables`. Для постоянного стенда выберите `Production`; для проверки ветки — также `Preview`.

### `audio-mass-api`

| Переменная                 | Значение                                           |
| -------------------------- | -------------------------------------------------- |
| `DATABASE_URL`             | создаётся Neon, pooled URL                         |
| `DATABASE_URL_UNPOOLED`    | создаётся/включается в Neon, direct URL            |
| `API_KEYS`                 | первый случайный секрет                            |
| `CORS_ORIGINS`             | точные Web URL через запятую, без завершающего `/` |
| `PYTHON_API_URL`           | `https://audio-mass-python-api.vercel.app`         |
| `PYTHON_API_INTERNAL_KEY`  | второй случайный секрет                            |
| `PYTHON_API_TIMEOUT_MS`    | `290000`                                           |
| `STORAGE_PROVIDER`         | `vercel-blob`                                      |
| `STORAGE_BUCKET`           | `audiomass-blob`                                   |
| `STORAGE_URL_TTL_SECONDS`  | `900`                                              |
| `STORAGE_MAX_UPLOAD_BYTES` | `104857600`                                        |
| `BLOB_READ_WRITE_TOKEN`    | создаётся Vercel Blob                              |
| `VERCEL_BLOB_ACCESS`       | `private`                                          |

Не добавляйте S3, MinIO или Supabase credentials при `STORAGE_PROVIDER=vercel-blob`.

### `audio-mass-python-api`

| Переменная                          | Значение                                            |
| ----------------------------------- | --------------------------------------------------- |
| `PYTHON_API_INTERNAL_KEY`           | тот же второй секрет, что в API                     |
| `PYTHON_API_ALLOWED_STORAGE_HOSTS`  | точный `<store-id>.private.blob.vercel-storage.com` |
| `PYTHON_API_ALLOW_INSECURE_STORAGE` | `false`                                             |
| `PYTHON_API_REMOTE_TIMEOUT_SECONDS` | `285`                                               |
| `PYTHON_API_MAX_CONCURRENT_JOBS`    | `1`                                                 |
| `PYTHON_API_MAX_UPLOAD_BYTES`       | `104857600`                                         |
| `PYTHON_API_LOG_LEVEL`              | `INFO`                                              |
| `PYTHON_API_WHISPER_MODEL`          | `tiny` для Hobby, `small` только после замеров      |
| `PYTHON_API_WHISPER_DEVICE`         | `cpu`                                               |
| `PYTHON_API_WHISPER_COMPUTE_TYPE`   | `int8`                                              |
| `HF_HOME`                           | `/tmp/huggingface`                                  |
| `NUMBA_CACHE_DIR`                   | `/tmp/numba`                                        |
| `VERCEL_SUPPORT_LARGE_FUNCTIONS`    | `1`                                                 |

`VERCEL_SUPPORT_LARGE_FUNCTIONS=1` нужен из-за SciPy, Librosa, CTranslate2, Faster-Whisper и встроенного FFmpeg. Если Large Functions недоступны аккаунту, сборка может превысить стандартный лимит Python Function.

### `audio-mass`

Основной локальный редактор работает без backend variables. Для дальнейшего подключения облачного API можно задать:

| Переменная            | Значение                                   |
| --------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://audio-mass-api.vercel.app/api/v1` |

Не публикуйте `API_KEYS` в Web. Текущий браузерный редактор не должен хранить серверный API key.

## 6. Порядок деплоя

### Шаг 1 — FastAPI

1. Добавьте все переменные `audio-mass-python-api`.
2. Откройте `Deployments` и запустите Redeploy последнего deployment ветки `agent/enterprise-migration`.
3. Проверьте:

```text
https://audio-mass-python-api.vercel.app/health/live
https://audio-mass-python-api.vercel.app/health/ready
```

`/health/ready` должен вернуть `ffmpeg_available: true`. В проект встроен `imageio-ffmpeg`, потому что Vercel не выполняет `apt-get` из Dockerfile.

### Шаг 2 — NestJS API

1. Убедитесь, что Neon и Blob подключены, а все API variables сохранены.
2. Укажите готовый FastAPI URL в `PYTHON_API_URL`.
3. Запустите Redeploy `audio-mass-api`.
4. Build Command из репозитория выполнит `prisma migrate deploy`, затем соберёт Prisma package и NestJS API.
5. Проверьте:

```text
https://audio-mass-api.vercel.app/api/v1/health/live
https://audio-mass-api.vercel.app/api/v1/health/ready
https://audio-mass-api.vercel.app/docs
```

`live` проверяет Function, `ready` — реальное соединение с Neon.

### Шаг 3 — Next.js Web

1. Оставьте production-сайт на стабильной ветке, пока API и Python health checks не зелёные.
2. Redeploy Preview ветки `agent/enterprise-migration` в `audio-mass`.
3. Откройте Preview URL и проверьте загрузку редактора, импорт аудио, Web Audio, waveform, темы и локализацию.
4. После проверки слейте ветку в `production` или поменяйте Branch Tracking осознанно.

## 7. Почему исходная ошибка исчезает

Ошибка `No Next.js version detected` возникала потому, что один Vercel Project смотрел в корень монорепозитория, где пакет `next` не является зависимостью корневого `package.json`.

Исправление:

- Web Root Directory — `apps/web`;
- API Root Directory — `apps/api`;
- Python Root Directory — `apps/python-api`;
- у каждого приложения свой `vercel.json`;
- workspace dependencies разрешены через `Include files outside the root directory`.

## 8. Ограничения полностью Vercel-only схемы

- На Hobby максимальная длительность Fluid Function — 300 секунд. Длинная транскрипция будет завершена с timeout.
- Максимальный HTTP request/response body Vercel Function значительно меньше больших аудиофайлов. Поэтому браузер, NestJS и FastAPI обмениваются короткими signed URLs, а аудио идёт напрямую через Blob.
- Стандартный Python bundle ограничен; тяжелому DSP-проекту обычно нужен Large Functions opt-in.
- Whisper model cache в `/tmp` непостоянный. После cold start модель может скачиваться повторно. Для Hobby используйте `tiny` и короткие записи.
- Private Blob требует точного hostname allowlist. Не заменяйте его на произвольные внешние домены или wildcard.
- `DATABASE_URL` должен оставаться pooled для runtime, а `DATABASE_URL_UNPOOLED` — direct для миграций.

Если нужны гарантированные многочасовые DSP-задачи, постоянный ML cache или GPU, это уже невозможно сохранить только в обычной Vercel Function. Для указанной Vercel-only схемы операции должны укладываться в лимиты Function, памяти и `/tmp`.

## 9. Финальная проверка

Перед переключением production traffic проверьте:

- три проекта показывают правильные Root Directory и framework;
- Neon подключён к API и обе database URL присутствуют;
- Blob Private и его токен есть только в API;
- internal key совпадает в API и Python;
- Python storage hostname точный;
- Python `/health/ready` видит FFmpeg;
- API `/health/ready` видит Neon;
- Prisma migrations завершились в Build Logs;
- Preview Web открывает редактор без ошибок консоли;
- production branch меняется только после успешного Preview.
