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

Wave D is delivered as independently reviewable substages:

1. **D.1 — mixer, routing, crossfade, and bounce domain:** move mute/solo,
   channel/master gain, pan routing, active crossfade pairs, and deterministic
   PCM mixdown behind importable audio-package APIs. Preserve the established
   5 ms overlap threshold, sine/cosine equal-power crossfade, and CPU fallback
   pan behavior with focused parity tests.
2. **D.2 — effect schemas and preset repository:** replace stringly modal
   payloads and comma-delimited custom presets with validated effect schemas,
   typed parameters, and versioned persistence. The schema catalog must retain
   established parameter ranges and built-in preset values for the primary
   effects, reject unknown/out-of-range persisted values, and migrate only
   legacy preset shapes whose positional contract is unambiguous. A browser
   storage adapter owns persistence; neither React nor the audio domain reads
   `localStorage` directly.
3. **D.3 — React effect workflows and runtime integration:** render effect
   forms from schemas, connect preview/apply commands to the native editor, and
   switch multitrack playback/export consumers to the new routing and bounce
   services before deleting the compatibility implementation. Specialized
   paragraphic-EQ, automation, repair, and other non-generic effect surfaces
   receive explicit React workflows rather than being forced through a lossy
   generic schema.

D.3 is implemented through reviewable checkpoints so the native UI never
advertises an effect that still resolves through the compatibility runtime:

- **D.3a — schema form and PCM transaction:** add a processor registry, native
  gain and peak/RMS/LUFS normalization, selection-scoped preview/apply/cancel
  commands, and a localized React dialog generated from the D.2 schemas. The
  registry must expose support explicitly; effects without a native processor
  remain unavailable instead of silently opening a legacy page.
- **D.3b1 — fixed-duration primary processors:** port compressor, hard limiter,
  feedback delay, waveshaping distortion, generated-impulse reverb, and the
  ten-band graphical EQ as deterministic immutable PCM processors. Characterize
  the established parameter mapping first, keep processed selections the same
  length, add focused numerical tests, and only expose a processor after it is
  registered.
- **D.3b2 — duration-changing and specialized workflows:** port seamless-loop,
  paragraphic EQ, automation, repair, and the remaining non-generic effects.
  These workflows own their duration/marker or curve models explicitly instead
  of being forced through the fixed-duration transaction from D.3a.
- **D.3c — multitrack runtime consumers:** connect native scheduling/routing to
  playback and the D.1 bounce service to export, then remove the superseded
  compatibility implementations and paths covered by Wave D.

D.3c uses the following explicit integration boundary:

- the audio package owns a typed multitrack application session, transport
  state, source ownership, scheduling decisions, mixer mutations, crossfade
  normalization, and deterministic bounce orchestration;
- a Web Audio playback adapter owns `AudioContext`, source/envelope nodes, the
  D.1 routing graph, transport clock, and disposal; React never schedules or
  connects audio nodes;
- the Next.js feature controller/store owns browser file decoding, project
  import/save, WAV download, and stable subscriptions, while decomposed React
  components only render project, transport, and mixer snapshots and dispatch
  typed commands;
- the native editor must load multiple audio files as independent source/clip
  records, update mute/solo/gain/pan/master controls without a global editor
  object, play/seek/pause/stop through the scheduler, and export the same
  project/range through `bounceProject`;
- tests must prove delayed and in-progress clip scheduling, source offsets,
  fade/crossfade envelopes, routing updates, transport cleanup, PCM source
  ownership, deterministic export, and the absence of `PKAudioEditor` or
  compatibility-asset imports from the native feature;
- only Wave D paths replaced by this native boundary are deleted in this
  checkpoint. The behavior-complete `/editor` runtime remains an isolated
  fallback until Wave E makes the React presentation complete and Wave F
  removes that boundary atomically.

### Wave E — React presentation replacement

- Port toolbar, timeline, waveform host, channels, markers, selection, menus,
  dialogs, analyzers, and mixer to React components.
- Consolidate CSS and remove direct DOM builders.
- Make the framework-native editor the only `/editor` implementation.

Wave E is delivered through presentation checkpoints that keep rendering,
editor commands, and audio processing in their owning layers:

1. **E.1 — waveform and track presentation:** add a revision-aware waveform
   analysis contract, worker-backed overview and per-channel peaks, responsive
   Canvas renderers, a semantic ruler, zoom/scroll viewport, playhead,
   selection gestures, marker overlays, and multitrack clip lanes. Canvas owns
   pixels only; React owns accessible structure and dispatches typed commands.
   Playback position updates must not recompute peaks, and stale worker results
   must be ignored after revision, size, or lifecycle changes.
2. **E.2 — menus, analyzers, and workspace composition:** replace the remaining
   presentation gaps with accessible React menus/panels, typed frequency and
   spectral-analysis ports, integrated analyzer surfaces, and a unified mixer
   workspace. No menu or analyzer may open a classic HTML page or mutate a
   document-global editor object.
3. **E.3 — production promotion:** complete responsive, keyboard, focus,
   localization, and browser-parity proof, then make the framework-native shell
   the `/editor` implementation. Keep the isolated compatibility runtime only
   until Wave F removes its route, assets, compiler, and declarations as one
   verified deletion.

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
- [x] Wave D: project/track/clip, scheduling, mixer/routing, crossfade, bounce,
      typed effects/presets, fixed-duration and specialized workflows, native
      multitrack playback/export, full local project persistence, and React
      consumers are complete and tested.
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

### Stage 4 — Wave D.1 multitrack mixer, routing, crossfade, and bounce

- **Status:** complete on 2026-07-30; the commit containing this report is the
  Wave D.1 checkpoint (`Complete framework-native editor Wave D.1`).
- **Delivered:** validated channel/master mixer updates; shared mute/solo
  audibility and gain rules; legacy-compatible linear CPU pan gains; a
  disposable, synchronizable Web Audio track/master routing graph; normalized
  crossfade-pair lifecycle; deterministic stereo PCM bounce through an audio
  source repository port.
- **Compatibility result:** channel and master controls retain their 0..1
  bounds, pan remains -1..1, stale crossfade pairs are removed after project
  mutations, overlaps must exceed 5 ms, and active overlaps use the established
  cosine/sine equal-power curve. CPU bounce preserves the compatibility
  mixer's interpolation, mute/solo behavior, mono duplication, linear pan
  fallback, selection-relative offsets, and unclipped summing.
- **Automated proof:** audio-engine has 15 passing test files / 52 tests. New
  tests cover mixer clamping and audibility, graph creation/synchronization/
  disposal, pan endpoints, crossfade ordering/toggling/stale cleanup/thresholds,
  stereo bounce, solo, master gain, selection offsets, and missing-source
  failure. Repository format, lint, typecheck, all JavaScript/TypeScript tests,
  and production builds passed; web remains at 22 files / 80 tests. Python
  Black, Ruff, strict mypy, and 35 pytest cases passed with 87.14% coverage.
- **Architectural result:** React and compatibility globals no longer own the
  reusable multitrack calculations or graph lifecycle. Playback/export adapters
  can consume stable package APIs in D.3 without reaching into `PKAudioEditor`.
- **Remaining after stage:** D.2 effect schemas and versioned presets; D.3 React
  effect workflows plus native scheduler/export integration; Wave E presentation
  parity; then Wave F compatibility deletion.

### Stage 5 — Wave D.2 effect schemas and versioned presets

- **Status:** complete on 2026-07-30; the commit containing this report is the
  Wave D.2 checkpoint (`Complete framework-native editor Wave D.2`).
- **Delivered:** discriminated number, boolean, select, and fixed number-list
  parameter contracts; validated schemas for gain, compressor, normalize, hard
  limiter, delay, distortion, reverb, ten-band graphical EQ, and seamless loop;
  45 typed built-in presets; strict `audiomass-effect-presets` v1 codec and
  immutable CRUD helpers; a browser `Storage` repository with injected clock/id
  ports.
- **Compatibility result:** established parameter bounds/defaults and built-in
  values are preserved, custom names retain the legacy 16-character limit, and
  corrupt/unknown/out-of-range values fail closed. Existing `pk_presetfx` or
  nested `effectPresets` data migrates once only for known positional contracts;
  ambiguous paragraphic/automation data stays on the compatibility path until
  its explicit D.3 workflow exists.
- **Automated proof:** audio-engine has 17 passing test files / 58 tests; web has
  23 passing test files / 83 tests. Tests cover schema uniqueness/defaults,
  exact legacy presets, unknown/null/range/list validation, codec round trips,
  timestamps, duplicate IDs, conservative legacy migration, repository CRUD,
  one-time preference migration, and corrupt-storage behavior. Repository-wide
  format, lint, typecheck, tests, and production builds passed. Python Black,
  Ruff, strict mypy, and 35 pytest cases remain green at 87.14% coverage.
- **Architectural result:** effect parameters and presets are data contracts,
  not markup order or global event payloads. The audio package has no DOM/storage
  dependency; browser infrastructure alone owns persistence; D.3 React forms can
  render and validate the same schemas used by commands.
- **Remaining after stage:** D.3 React forms, preview/apply ports, specialized
  paragraphic-EQ/automation/repair workflows, and native multitrack playback/
  export integration; then Wave E presentation parity and Wave F deletion.

### Stage 6 — Wave D.3a native React effect transaction

- **Status:** complete on 2026-07-30; the commit containing this report is the
  Wave D.3a checkpoint (`Complete framework-native editor Wave D.3a`).
- **Delivered:** an injectable native effect-processor registry; immutable gain
  and peak/RMS/LUFS normalization processors; selection-scoped typed
  preview/apply/cancel commands; preview restoration of original PCM and cursor;
  a localized schema-driven React dialog for number, boolean, select, and
  number-list fields; D.2 built-in/custom preset loading and saving through the
  browser repository.
- **Compatibility result:** gain retains its 0..2.5 contract; linked and
  independent peak/RMS normalization retain channel semantics; LUFS uses the
  shared BS.1770 analysis and true-peak ceiling. Preview PCM never enters undo
  history, apply is one undoable transaction, transport remains usable during
  preview, and unavailable processors fail closed instead of opening legacy
  HTML pages. Duration-changing effects are reserved for specialized workflows.
- **Automated proof:** audio-engine has 18 passing test files / 64 tests; web has
  23 passing test files / 85 tests. New tests cover immutable gain, linked and
  independent peak/RMS behavior, LUFS processing, invalid/unavailable effects,
  preview cancellation, cursor/PCM restoration, undo, controller routing, and
  the no-legacy React boundary. Repository format, lint, typecheck, tests, and
  production builds passed. Python Black, Ruff, strict mypy, and all 35 pytest
  cases passed with 87.14% coverage using an isolated local pytest temp/cache.
- **Architectural result:** React renders domain schemas and sends typed
  commands; the session owns preview/history transactions; the audio package
  owns validation and PCM processing; browser storage remains infrastructure.
  Native support is capability-driven, so UI availability cannot drift from
  the processor registry or fall through to a compatibility popup.
- **Remaining after stage:** D.3b ports the remaining primary and specialized
  processors/workflows; D.3c connects native multitrack playback/export and
  deletes the superseded Wave D compatibility paths. Wave E then completes
  presentation parity before the final Wave F deletion.

### Stage 7 — Wave D.3b1 fixed-duration primary processors

- **Status:** complete on 2026-07-30. Scope was committed and pushed first as
  `903cea6` (`Refine native editor processor migration plan`); the commit
  containing this report is the D.3b1 implementation checkpoint
  (`Complete framework-native editor Wave D.3b1`).
- **Delivered:** six immutable processors for compressor, hard limiter,
  feedback delay, waveshaping distortion, generated-impulse reverb, and the
  ten-band graphical EQ. Gain/normalization moved into a focused processor
  module; dynamics, delay/reverb, distortion, equalizer, and shared value
  helpers are separate modules behind the small registry composition root.
  `EditorSession` now exposes the injected registry capabilities, so React
  automatically enables all eight implemented fixed-duration effects and no
  static UI list can drift from the actual runtime.
- **Compatibility result:** compressor retains threshold/knee/ratio plus linked
  envelope, attack/release smoothing, and post-compression makeup gain. Limiter
  retains look-ahead blocks and the established low/high fill ratio while also
  providing explicit brickwall mode. Delay/reverb retain the compatibility
  cross-mix mapping; delay retains recursive feedback; distortion uses the
  characterized 44,100-point waveshaper equation; graphical EQ retains the
  32-16,000 Hz bands, Q=4.6, and low/high shelf edges. Reverb replaces
  nondeterministic `Math.random()` with a deterministic, energy-normalized
  sparse impulse using the same time/decay envelope. Every processor preserves
  channel count, sample rate, selection length, source ownership, and finite
  output; seamless-loop remains unavailable until its marker-aware workflow.
- **Automated proof:** audio-engine has 19 passing test files / 71 tests; web has
  23 passing test files / 85 tests. New numerical tests cover compressor ratio,
  attack/release, hard and shaped limiting, recursive delay taps, the exact
  distortion curve, deterministic finite reverb, reset identity, and a 1 kHz
  EQ boost. Controller tests prove capability-driven availability and that
  seamless-loop still fails closed. Repository format, lint, typecheck, all
  TypeScript tests, and production builds passed. Python Black, Ruff, strict
  mypy, and all 35 pytest cases passed with 87.14% coverage using an isolated
  local pytest temp/cache.
- **Architectural result:** effect algorithms are framework-independent DSP
  modules, the registry owns composition/capabilities, the session owns effect
  transactions, and React only renders supported schemas. No processor imports
  DOM, Web Audio nodes, storage, editor globals, or legacy HTML routes.
- **Remaining after stage:** D.3b2 implements seamless-loop with duration and
  marker transforms plus paragraphic EQ, automation, repair, and the remaining
  specialized effects; D.3c then connects native multitrack playback/export and
  deletes superseded Wave D compatibility paths.

### Stage 8 — Wave D.3b2 specialized effect workflows

- **Status:** complete on 2026-07-30. Scope was committed and pushed first as
  `ffb0dd4` (`Plan specialized editor effect workflows`); the commit containing
  this report is the D.3b2 implementation checkpoint
  (`Complete framework-native editor Wave D.3b2`).
- **Delivered:** discriminated and runtime-validated models for seamless loop,
  paragraphic EQ, gain automation, and audio repair; immutable PCM processors
  plus typed workflow metadata; duration-aware selection and marker transforms;
  specialized preview/apply commands in `EditorSession`; controller capability
  APIs; and four decomposed, localized React forms. Shared RBJ biquad design and
  filtering moved into a common DSP module used by both graphical and
  paragraphic EQ plus hum repair.
- **Compatibility result:** seamless loop retains the 0.0007 trim threshold,
  1 ms edge padding, 10 ms zero-crossing search, equal-power crossfade, and
  1..64 repeats. Applying it now shifts later markers, maps markers inside the
  source loop, and selects the exact replacement duration in one undoable
  transaction. Paragraphic EQ retains enabled peaking/high-pass/low-pass bands,
  0..20 kHz frequency, +/-35 dB gain, per-band Q, and peaking-first chain order.
  Automation sorts unique points, linearly interpolates between them, and holds
  first/last boundary values. Repair retains low/medium/high de-click and splice
  thresholds, Hermite interpolation, 50/60 Hz Goertzel auto-detection, and eight
  Q=12 harmonic notches. All workflows preserve source ownership, channel
  count/sample rate, and finite deterministic output.
- **Automated proof:** audio-engine has 20 passing test files / 80 tests; web has
  23 passing test files / 86 tests; the complete TypeScript suite has 207 tests.
  New tests cover strict workflow validation, exact loop crossfade/repeat PCM,
  duration/selection/marker transforms, paragraphic high-pass response,
  automation interpolation and boundaries, de-click, hum detection/notching,
  splice smoothing, specialized preview/cancel/apply/undo, controller routing,
  and the no-legacy React boundary. Repository format, lint, typecheck, all
  tests, and production builds passed. Python Black, Ruff, strict mypy, and all
  35 pytest cases passed with 87.14% coverage using isolated local temp/cache.
- **Architectural result:** fixed-duration schema processors and specialized
  workflows are now intentionally separate. The audio package owns validation,
  DSP, duration/marker transforms, and metadata; the session owns preview and
  history; the controller exposes typed capabilities; React owns only form
  state and localized interaction. No new module imports DOM, Web Audio nodes,
  storage, global editor objects, legacy events, or legacy HTML routes.
- **Remaining after stage:** D.3c connects the D.1 scheduler/routing and bounce
  services to native multitrack playback/export, then deletes the superseded
  Wave D compatibility implementations. Wave E still completes presentation
  parity before the final Wave F boundary deletion.

### Stage 9 — Wave D.3c native multitrack runtime consumers

- **Status:** complete on 2026-07-30. Scope was committed and pushed first as
  `12c7103` (`Plan native multitrack runtime integration`); the commit containing
  this report is the D.3c implementation checkpoint
  (`Complete framework-native editor Wave D.3c`).
- **Delivered:** a whole-project scheduler for active and delayed clips; an
  owned in-memory PCM source repository; a disposable Web Audio playback
  adapter that schedules buffer/envelope nodes through the D.1 mixer graph; a
  typed multitrack application session for project, source, mixer, crossfade,
  transport, and bounce state; and public package contracts for every boundary.
  The Next.js feature now has a browser PCM decoder, controller, stable external
  store, localized React transport/timeline/mixer, multi-file track creation,
  track/master controls, full/range WAV export, and complete IndexedDB document
  save/restore including owned PCM, mixer, and crossfade data.
- **Compatibility result:** clips already under the playhead start at their
  exact source offset while future clips retain timeline-relative delay. The
  adapter preserves clip fades and active equal-power crossfades, routes
  mute/solo/gain/pan/master changes without rescheduling React state, validates
  every source before starting any node, and stops/disconnects all nodes on
  pause, seek, stop, structural mutation, and close. Export consumes the same immutable
  project/source/mixer/crossfade state through D.1 `bounceProject`. The retained
  `/tools/multitrack-mixer` fallback no longer reaches into its host from the
  component; its temporary global contract is isolated in one tested adapter.
- **Automated proof:** audio-engine has 22 passing test files / 85 tests; web
  has 25 passing test files / 90 tests; the complete JavaScript/TypeScript suite
  has 64 files / 216 tests. New tests cover active/future scheduling, offsets,
  fade and equal-power crossfade curves, atomic missing-source failure, node
  cleanup, PCM copy ownership, session document round trips, mixer/bounce
  coordination, controller decode/save/restore/export routing, legacy-host
  isolation, and the no-compatibility native boundary. Repository formatting,
  lint, TypeScript typecheck, Prisma generation, all tests, and all production
  builds passed. Python Black, Ruff, strict mypy, and all 35 pytest cases passed
  with 87.14% coverage using isolated local temp/cache directories.
- **Architectural result:** React dispatches typed multitrack intent and renders
  snapshots; the Next.js controller owns browser orchestration; infrastructure
  owns decoding, IndexedDB, workers, blobs, and downloads; the audio package
  owns source data, scheduling, routing, transport, and export. No native module
  imports the classic runtime, editor globals, iframe messaging, or old HTML
  routes. Wave D is complete.
- **Remaining after stage:** Wave E still replaces the full production waveform,
  track-lane, menu, analyser, and docking presentation and promotes the native
  route to `/editor`. Wave F then deletes `apps/web/editor-runtime`, the iframe
  bridge/manifest/build, the temporary legacy mixer adapter, and compatibility
  CSS atomically; Wave G records browser/release proof.

## Overall stage summary

| Wave | State       | Current result                                                                 |
| ---- | ----------- | ------------------------------------------------------------------------------ |
| A    | Complete    | Typed application/domain platform and React lifecycle                          |
| B    | Complete    | Leaf services, metadata, workers, persistence adapters, and vendor isolation   |
| C    | Complete    | PCM-aware history, playback proof, edit commands, recording, and WAV export UI |
| D    | Complete    | Native multitrack/effect domain, workflows, playback, persistence, and export  |
| E    | Not started | Full React editor presentation replacement                                     |
| F    | In progress | Server contracts exist; compatibility deletion waits for browser parity        |
| G    | In progress | Documentation is current; final browser and release proof remains              |

Nine structural stages are complete. This is not the final legacy deletion:
`apps/web/editor-runtime` intentionally remains the production fallback until
Waves C-E pass parity and Wave F removes the entire boundary atomically.
