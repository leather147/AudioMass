# Framework-native editor rewrite plan

## Purpose

The TypeScript source migration completed in `d1841b2` removed the last
first-party classic JavaScript files, but it deliberately preserved the old
runtime contracts. This plan removes that compatibility architecture as well:
ordered scripts, IIFEs, mutable globals, opaque JSON-derived types, direct DOM
construction, and the isolated editor iframe.

The rewrite is behavior-preserving. It does not move latency-sensitive Web
Audio work to a server and it does not duplicate one operation in all three
frameworks. Each operation belongs to exactly one execution boundary:

- Next.js and React own the browser editor, interaction state, UI, local-first
  persistence, and orchestration of browser audio services;
- NestJS owns authenticated server contracts, projects, files, processing jobs,
  storage grants, and calls to the private compute service;
- FastAPI owns bounded CPU-heavy DSP, analysis, export, transcription, and
  trusted Python plugins;
- `packages/audio-engine` owns framework-independent browser audio domain code,
  workers, AudioWorklets, PCM editing, playback, recording, and multitrack
  scheduling;
- `packages/plugin-sdk` owns browser plugin contracts and lifecycle.

## Non-negotiable completion criteria

The rewrite is complete only when all of the following are true:

1. `apps/web/editor-runtime` and `/editor-runtime` no longer exist.
2. The editor renders as React client components directly under `/editor`.
3. No first-party IIFE, `module: none`, ordered script manifest, iframe bridge,
   `PKAudioEditor`, `PKAudioFX`, `PKSimpleModal`, or `AMLateRuntimeValue` remains.
4. No production type is based on `ReturnType<typeof JSON.parse>`, `any`, or an
   unvalidated `unknown` cast.
5. Browser audio modules are imported through ESM package exports and receive
   dependencies through constructors, factories, hooks, or React context.
6. Browser code never calls FastAPI directly. Remote processing always follows
   `Next.js -> NestJS -> FastAPI`.
7. The 8 vendor assets are either isolated behind typed adapters or replaced by
   maintained ESM dependencies without losing codec/export behavior.
8. Runtime CSS is consolidated into feature-level CSS Modules and shared theme
   tokens; the legacy token bridge and patch-file stack are deleted.
9. Unit, integration, browser parity, build, and documentation checks pass.

## Target web structure

```text
apps/web/
  app/editor/
    loading.tsx
    page.tsx
  features/editor/
    application/
      editor-controller.ts
      editor-commands.ts
      editor-shortcuts.ts
      use-editor.ts
    components/
      editor-shell.tsx
      timeline/
      transport/
      tracks/
      dialogs/
      effects/
    infrastructure/
      browser-file-adapter.ts
      browser-media-adapter.ts
      indexed-db-project-repository.ts
      nest-processing-client.ts
    state/
      editor-reducer.ts
      editor-selectors.ts
      editor-store.tsx
    styles/
      editor-tokens.css
      editor-shell.module.css
```

React components only render and translate user interaction into typed
application commands. They do not manipulate arbitrary DOM nodes and do not
own `AudioNode` instances. The controller owns use cases; the audio package owns
the audio graph; adapters own browser APIs and network I/O.

## Target browser audio package

```text
packages/audio-engine/src/
  application/
    commands/
    export-audio.ts
    render-effect.ts
  domain/
    audio-clip.ts
    audio-project.ts
    audio-track.ts
    edit-history.ts
    effects.ts
    markers.ts
    selection.ts
  infrastructure/
    codecs/
    web-audio/
    workers/
    worklets/
  multitrack/
    mixer.ts
    scheduler.ts
    track-graph.ts
```

The package has no React, Next.js, NestJS, or FastAPI imports. Its public API is
strictly typed and can be tested with fake ports.

## Legacy module ownership map

| Existing TypeScript source              | Framework-native destination                      | Required rewrite                                                            |
| --------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `app.ts`                                | `features/editor/application`                     | Replace singleton/event bus with controller, typed commands, and lifecycle  |
| `state.ts`                              | `features/editor/state` + audio domain            | Immutable reducer/store and bounded typed history                           |
| `keys.ts`                               | `features/editor/application/editor-shortcuts.ts` | React effect with declarative shortcut map and cleanup                      |
| `drag.ts`, `contextmenu.ts`             | React components/hooks                            | Pointer events, accessible menu state, no document-global mutation          |
| `modal.ts`                              | `components/editor/dialogs`                       | Native React dialogs, focus management, typed result promises               |
| `ui.ts`                                 | `components/editor`                               | Split transport, timeline, selection, tracks, toolbar, status, menus        |
| `ui-fx.ts`                              | `components/editor/effects`                       | Schema-driven effect forms and preview transactions                         |
| `engine.ts`                             | `packages/audio-engine`                           | Split playback graph, decoding, selection, editing, analysis, export        |
| `actions.ts`                            | audio application commands                        | One command per edit operation with typed input/output and undo transaction |
| `audio-buffer-operations.ts`            | audio domain/DSP                                  | Pure PCM functions with explicit channel/sample-rate contracts              |
| `audio-effect-utilities.ts`             | audio domain/DSP                                  | Pure gain, fade, rate, normalization, and routing functions                 |
| `recorder.ts`, `recorder-worklet.ts`    | audio infrastructure/worklets                     | Typed recorder session and worklet message protocol                         |
| `multitrack.ts`                         | audio multitrack + React tracks                   | Separate project model, scheduler/mixer, and presentation                   |
| `markers.ts`                            | audio domain + React timeline                     | Typed marker collection and view-model                                      |
| `fx-auto.ts`, `fx-pg-eq.ts`             | audio effects + React forms                       | Separate DSP graph from controls and presets                                |
| `loudness-analysis.ts`                  | audio analysis                                    | Importable service; optionally route large jobs to NestJS                   |
| `tempo-estimator.ts`, `tempo-worker.ts` | audio workers                                     | ESM worker factory and discriminated message protocol                       |
| `wav.ts`                                | audio codecs/workers                              | Importable encoder and typed worker client                                  |
| `amss-format.ts`                        | audio project codec                               | Versioned schema, validation, migrations, no globals                        |
| `metadata-service.ts`                   | audio metadata adapter                            | Typed ID3/MP4 adapter; vendor parser isolated behind a port                 |
| `local-session-store.ts`                | web infrastructure                                | IndexedDB repository implementing a project repository port                 |
| theme modules                           | Next.js theme feature                             | React provider, server-readable preference, CSS variables                   |
| locale modules                          | Next.js locale feature                            | Typed dictionaries, server/client locale provider, no reload                |
| appearance/welcome/settings modules     | Next.js routes/components                         | React settings and onboarding components                                    |
| toolbar/presentation modules            | React components/hooks                            | Merge extensions into their owning component                                |
| `notification-service.ts`               | React notification provider                       | Typed notification queue and live region                                    |
| `menu-check-service.ts`                 | React menu primitive                              | Semantic checked menu items, no generated HTML strings                      |
| `next-bridge.ts`                        | deleted                                           | Direct component/controller communication replaces `postMessage`            |

## NestJS work

The gateway is already organized as NestJS modules. This wave extends its
framework-native boundary instead of moving browser code into controllers:

1. Add an authenticated editor-processing facade with DTOs generated from the
   supported remote-operation catalog.
2. Keep controllers transport-only and services responsible for orchestration.
3. Validate every operation-specific parameter object before creating a job.
4. Return stable response DTOs rather than raw Python dictionaries.
5. Publish OpenAPI contracts consumed by the Next.js server-side client.
6. Preserve idempotency, owner scoping, timeouts, output-file completion, and
   failure transitions.

## FastAPI work

FastAPI remains a private compute service:

1. Group routers by analysis, effects, export, transcription, and jobs.
2. Use Pydantic discriminated models for each operation and its result.
3. Keep request parsing in routers, orchestration in services, and DSP in pure
   domain functions.
4. Execute CPU-bound functions through the shared limiter/thread-pool service.
5. Validate signed remote input/output descriptors and output sizes.
6. Generate and test OpenAPI so NestJS and Python cannot drift silently.

## Delivery waves

### Wave A — module platform and contracts

- Introduce typed editor domain/application ports.
- Add React editor provider and controller lifecycle.
- Add a framework-native editor route behind a temporary feature flag.
- Add import-boundary and no-global tests.

### Wave B — leaf services and browser infrastructure

- Move preferences, theme, locale, notifications, local storage, formats,
  metadata, WAV, tempo, and loudness to importable modules.
- Compile workers/worklets from package sources.
- Remove their runtime globals and compatibility facades.

### Wave C — state, playback, actions, and recording

- Replace the custom event bus with typed commands/events.
- Move edit history and selection into the domain model.
- Split the Web Audio graph and recording lifecycle from UI.
- Port single-track behavior with parity tests.

### Wave D — multitrack and effects

- Introduce typed project/track/clip entities.
- Move scheduling, routing, crossfades, bounce, and channel state into the audio
  package.
- Implement schema-driven React effect dialogs and presets.

### Wave E — React presentation replacement

- Port toolbar, timeline, waveform host, channels, markers, selection, menus,
  dialogs, analyzers, and mixer to React components.
- Consolidate CSS and remove direct DOM builders.
- Make the framework-native editor the only `/editor` implementation.

### Wave F — server contracts and compatibility deletion

- Complete NestJS operation DTOs and FastAPI discriminated schemas.
- Delete iframe route, bridge, script manifest, classic runtime compiler,
  global declarations, compatibility ESLint exceptions, and old CSS patches.
- Replace or isolate old vendor libraries.

### Wave G — documentation and release proof

- Update every tracked Markdown document.
- Run JavaScript/TypeScript, Python, Prisma, OpenAPI, production build, and
  browser parity checks.
- Record the final inventory and commit only with a clean worktree.

## Verification matrix

| Layer         | Required checks                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Web           | React component tests, reducer/controller tests, keyboard/accessibility checks, browser parity |
| Audio package | PCM/DSP unit tests, fake Web Audio integration, worker/worklet protocol tests                  |
| NestJS        | DTO validation, controller/service tests, Python-client contract tests, OpenAPI snapshot       |
| FastAPI       | Ruff, Black, mypy, pytest, OpenAPI schema and real-audio fixtures                              |
| Repository    | format, lint, typecheck, all tests, production builds, dependency and license audits           |

## Progress

- [x] Classic first-party JavaScript source deletion (`d1841b2`).
- [x] Framework ownership and completion criteria defined.
- [x] Wave A platform: `EditorSession`, React controller/provider, native preview,
      strict command/event boundary, and no-global contract test.
- [x] Wave B: themes, locale, notifications, drop adapter, versioned project
      codec, IndexedDB repository, ID3/MP4 metadata, WAV and tempo worker
      clients/protocols, loudness, typed leaf DSP, and the eight-asset vendor
      gateway are native and tested.
- [x] Wave C: playback/session, PCM-aware undo/redo, copy/cut/paste/delete/trim,
      silence insertion, selection/marker transforms, recording/worklet,
      keyboard controls, and typed WAV export UI are native and tested.
- [ ] Wave D (in progress): project/track/clip domain and scheduler are native;
      mixer graph, effects UI/presets, bounce and crossfade parity remain.
- [ ] Wave E.
- [ ] Wave F (in progress): Nest operation DTOs and FastAPI discriminated jobs
      are implemented; compatibility deletion waits for Waves B-E.
- [ ] Wave G (documentation synchronized at this checkpoint; final release
      proof remains).

## Stage reports

Every structural stage ends with this report, its verification evidence, one
reviewable commit, and an explicit push to `agent/repository-hardening`.

### Stage 1 — framework-native foundation

- **Status:** complete and pushed on 2026-07-30.
- **Commit:** `4b2ea19` (`Build framework-native editor foundation`).
- **Delivered:** React `/editor/native` route; controller/provider/store/hooks;
  transport, timeline, marker, dialog, and notification components; typed
  themes; `EditorSession`; history, marker, project, PCM/DSP/WAV, recorder,
  loudness, tempo, multitrack, NestJS operation DTO, and FastAPI job foundations.
- **Compatibility result:** `/editor` stayed on the behavior-complete runtime;
  the new path introduced no `PKAudioEditor`, `PKAudioFX`, iframe, or new global
  dependency.
- **Verification:** repository format, lint, TypeScript typecheck, JavaScript /
  TypeScript tests, production builds, and Python Black/Ruff/mypy/pytest passed.
- **Remaining after stage:** metadata, worker client boundaries, vendor
  isolation, then the state/playback/effects/presentation parity waves.

### Stage 2 — Wave B leaf services and browser infrastructure

- **Status:** complete on 2026-07-30; the commit containing this report is the
  Wave B checkpoint (`Complete framework-native editor Wave B`).
- **Delivered:** native ID3v2.2/v2.3/v2.4 and MP4/M4A metadata reader plus ID3
  writer; public metadata contracts; ESM tempo worker; discriminated WAV/tempo
  protocols; request-correlated clients that transfer owned PCM copies and
  reject pending work on shutdown; one typed Next.js gateway and absolute
  allowlist for the eight retained WaveSurfer, LAME, libFLAC, LZ4, and RNNoise
  assets.
- **Compatibility result:** ID3 writes preserve the original audio payload;
  MP4 fields and artwork are decoded without mutating input; established tempo
  folding remains 89.8/80 BPM where required; vendor bytecode is unchanged and
  codec worker URLs remain same-origin.
- **Automated proof:** audio-engine has 9 passing test files / 33 tests; web has
  21 passing test files / 79 tests. Metadata round trips, truncated input,
  worker copy ownership, discriminated errors, vendor ordering, runtime shape
  validation, and the exact eight-asset inventory are covered.
- **Architectural result:** Wave B is complete. Vendor globals are now an
  infrastructure implementation detail rather than an API available to React,
  controllers, or the audio domain.
- **Remaining after stage:** Wave C single-track command/playback parity, Wave D
  mixer/effects parity, Wave E React presentation, then Wave F compatibility
  deletion and the final Wave G browser/release proof.

### Stage 3 — Wave C single-track state, playback, editing, and export

- **Status:** complete on 2026-07-30; the commit containing this report is the
  Wave C checkpoint (`Complete framework-native editor Wave C`).
- **Delivered:** immutable document/PCM session state; PCM-aware bounded
  undo/redo; pure copy, cut, paste, delete, trim, select-all, and sample-aligned
  silence commands; deterministic marker insert/remove/replace/trim transforms;
  browser selection/edit controls; stop/volume transport controls; keyboard
  copy/cut/paste/delete/select-all; typed 16/24/32-bit WAV export and download
  ports.
- **Compatibility result:** edits operate on owned channel data, paste preserves
  the clipboard, deletion keeps a Web-Audio-compatible minimal buffer, markers
  remain aligned after duration changes, and undo/redo restores the actual audio
  graph rather than only visual metadata.
- **Automated proof:** audio-engine has 12 passing test files / 43 tests; web has
  22 passing test files / 80 tests. Tests cover fake Web Audio playback,
  PCM ownership, edit/marker transactions, full-buffer deletion, history audio
  restoration, filename safety, encoder cleanup, controller download routing,
  shortcuts/import boundaries, and the existing compatibility contracts.
- **Architectural result:** Wave C is complete. React components emit typed
  commands; the session owns transactions; pure audio/domain modules own data
  changes; browser infrastructure alone owns Blob/download behavior.
- **Remaining after stage:** Wave D mixer/effect graph, presets, crossfade and
  bounce parity; Wave E completes the waveform/tracks/menus/analyzers React UI;
  Wave F can then remove the compatibility runtime atomically.

## Overall stage summary

| Wave | State       | Current result                                                                 |
| ---- | ----------- | ------------------------------------------------------------------------------ |
| A    | Complete    | Typed application/domain platform and React lifecycle                          |
| B    | Complete    | Leaf services, metadata, workers, persistence adapters, and vendor isolation   |
| C    | Complete    | PCM-aware history, playback proof, edit commands, recording, and WAV export UI |
| D    | In progress | Project/track/clip scheduling exists; mixer, effects, bounce, crossfade remain |
| E    | Not started | Full React editor presentation replacement                                     |
| F    | In progress | Server contracts exist; compatibility deletion waits for browser parity        |
| G    | In progress | Documentation is current; final browser and release proof remains              |

Three structural stages are complete. This is not the final legacy deletion:
`apps/web/editor-runtime` intentionally remains the production fallback until
Waves C-E pass parity and Wave F removes the entire boundary atomically.
