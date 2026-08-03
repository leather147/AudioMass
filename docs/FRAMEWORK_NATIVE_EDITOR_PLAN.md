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

E.2 uses the following explicit native presentation boundary:

- the audio package owns deterministic FFT/STFT analysis, normalized frequency
  and spectrogram result contracts, option validation, and numerical tests;
- a request-correlated worker client owns copied PCM transfer, cancellation,
  failures, and disposal. The Next.js controller creates it lazily and keys
  analysis to the rendered-audio revision so transport updates never repeat DSP;
- decomposed React frequency and spectrogram panels own responsive Canvas
  rendering, accessible summaries and controls, loading/error states, and stale
  result rejection. Canvas paints pixels only and never reads editor state;
- an accessible React menu bar and typed panel registry compose waveform,
  frequency, spectral, markers, effects, and multitrack mixer surfaces inside
  the native editor. Menu actions dispatch typed controller commands or select
  registered panels; they never construct HTML or open a classic page;
- the framework-native feature must not import `components/tools`, legacy mixer
  adapters, editor tool routes, runtime globals, or compatibility assets. The
  `/tools/*` adapters required only by the behavior-complete fallback remain
  outside the native graph until E.3 promotes `/editor`, then Wave F deletes
  that isolated compatibility boundary atomically;
- focused tests must cover transform accuracy, bounds and finite output, worker
  ownership/lifecycle, revision-stable controller routing, panel/menu registry,
  localization, accessibility structure, and the no-compatibility import rule.

E.3 uses the following production-promotion boundary:

- `/editor` becomes a Server Component entry that reads validated preferences
  and awaited query state, then renders the framework-native `EditorShell`
  directly. `/editor/native` remains only as a compatibility redirect that
  preserves a validated panel selection; it must not maintain a second editor
  composition;
- `apps/web/editor-runtime`, `/editor-runtime`, its bridge, generated assets,
  fallback `/tools/*` routes, and temporary host adapters remain unchanged and
  isolated until Wave F. Production promotion removes their `/editor` consumer,
  but deletion is a separate atomic checkpoint with its own inventory and proof;
- the React menu implements roving top-level focus and keyboard navigation for
  Arrow keys, Home, End, Enter/Space, Escape, and Tab; popup focus returns to its
  trigger, separators are semantic, disabled commands are skipped, and Settings
  and About use App Router links rather than popup windows;
- panel selection is represented by the typed registry and a canonical
  `/editor?panel=...` URL without remounting editor domain state. Focus rings,
  status announcements, dialog behavior, waveform keyboard seeking, and global
  shortcuts must remain usable without a pointer;
- every user-facing native fallback, navigation label, state, and accessibility
  label is sourced from the English/Russian catalog. The root Server Component
  remains the owner of the cookie-derived document language and the native shell
  receives only serializable preference data;
- responsive CSS must avoid page-level horizontal overflow at 320 CSS pixels,
  clamp menus to the viewport, make dialogs internally scrollable, preserve
  usable touch targets, and keep waveform, analyzer, mixer, marker, toolbar, and
  status surfaces reachable at phone, tablet, and desktop sizes;
- browser proof covers `/editor` at desktop, tablet, and phone viewports; menu
  keyboard/focus behavior; every registered workspace; Russian/default and
  English/light preference round trips; absence of framework error overlays,
  blank output, failed runtime requests, and console errors. Automated boundary
  tests must prove `/editor` no longer imports `EditorFrame`, iframe/runtime
  bridge code, legacy globals, classic HTML routes, or tool adapters.

### Wave F — server contracts and compatibility deletion

- Complete NestJS operation DTOs and FastAPI discriminated schemas.
- Delete iframe route, bridge, script manifest, classic runtime compiler,
  global declarations, compatibility ESLint exceptions, and old CSS patches.
- Replace or isolate old vendor libraries.

Wave F uses the following atomic compatibility-deletion boundary:

- the deletion inventory starts from the clean, pushed E.3 checkpoint and
  includes all 116 tracked files under `apps/web/editor-runtime` (approximately
  16.9 MB), `/editor-runtime`, `EditorFrame`, bridge/document/manifest helpers,
  the serial preference queue used only by the iframe, fallback tool hosts,
  classic runtime test harnesses, generated asset output, runtime compiler/copy
  scripts, global declarations, and classic ESLint/TypeScript/Turbo exceptions;
- `/tools/frequency-analyser`, `/tools/spectral-analyser`, and
  `/tools/multitrack-mixer` retain URL compatibility only as Server Component
  redirects to the registered native editor panels. Their client tool hosts,
  same-origin mixer adapter, global access, query bridge, and CSS are deleted;
- the unused `LegacyEditorVendorGateway`, its allowlist, and the vendor files
  reachable only through that gateway are deleted with the runtime. Native WAV,
  PCM, analysis, effects, waveform Canvas, recording, metadata, persistence,
  and multitrack modules remain owned by `@audiomass/audio-engine` and the React
  feature graph; no production module may retain an `/editor-assets` import;
- installable offline behavior moves before deletion: App Router owns the web
  manifest and icon metadata, a native client hook registers the root service
  worker, and the worker precaches the canonical editor plus observed same-origin
  Next.js resources. The cache no longer references `/editor-runtime` or copied
  classic assets;
- Web scripts keep only the audio-package prerequisite. `predev`, `pretest`, and
  `prebuild` no longer compile or copy classic sources; clean/Turbo/gitignore,
  root and Web ESLint, and Web TypeScript configuration lose runtime-only paths;
  generic tooling is deleted only when repository search proves it has no other
  consumer;
- replacement tests prove the compatibility directories, routes, globals,
  generated paths, and configuration hooks are absent; native panel redirects,
  PWA metadata/offline registration, Server/Client boundaries, editor features,
  server DTOs, and Python discriminated job schemas remain covered. Production
  build route output must contain `/editor` and the three panel redirects but no
  `/editor-runtime` route;
- browser proof covers fresh-load and reload behavior, every redirect target,
  English/Russian and dark/light preferences, audio import/waveform/effect
  interaction, no missing asset requests, service-worker registration, manifest
  reachability, and the absence of framework overlays or console errors. Only
  after complete JS/TS, Python, Prisma, OpenAPI, build, and browser proof may the
  deletion checkpoint be reported as complete.

### Wave G — documentation and release proof

- Update every tracked Markdown document.
- Run JavaScript/TypeScript, Python, Prisma, OpenAPI, production build, and
  browser parity checks.
- Record the final inventory and commit only with a clean worktree.

Wave G uses the following release-documentation boundary:

- the wave starts from clean, pushed commit `89e1d83` and covers all 12 tracked
  Markdown files. Current-state guides must describe only the framework-native
  repository; superseded runtime details may remain solely in explicitly
  historical records;
- README, architecture, migration, API, Python API, deployment, Vercel-only,
  operations, notices, and both rewrite plans receive an explicit final-state
  review. Routes, commands, environment variables, ownership boundaries,
  versions, and cross-document links must agree with the repository;
- a repository-owned documentation check validates every tracked Markdown
  relative link and the canonical document set. CI and the root scripts run it,
  preventing renamed or deleted files from silently leaving broken guidance;
- final inventories record tracked source languages, remaining browser
  JavaScript, forbidden legacy symbols/paths, App Router routes, workspace
  packages, Vercel configurations, Prisma generation, and OpenAPI coverage.
  Historical names do not count as executable legacy code when clearly marked;
- release proof includes frozen dependency installation, dependency audits,
  formatting, documentation integrity, lint, strict typecheck, all tests,
  production builds, Python Black/Ruff/mypy/pytest, Prisma/OpenAPI contracts,
  and a production Chromium smoke pass. Any failure must be resolved or recorded
  precisely rather than omitted;
- Stage 14 closes Wave G only after the plan contains per-stage and overall
  results, the implementation commit is reviewable, the worktree is clean, and
  the explicit `agent/repository-hardening` push is synchronized at 0/0.

### Wave H — original AudioMass interface parity

Wave H corrects an invalid conclusion in Wave E/G: the production browser smoke
proved routing, responsiveness, preferences, offline loading, and the absence
of runtime errors, but did not prove visual equivalence with the original
AudioMass editor. The simplified form-and-card composition is therefore not an
acceptable final presentation layer.

- Reconstruct the original editor hierarchy as framework-native React:
  application menu, time display, transport and edit button groups, marker and
  document controls, overview, selection readout, BPM controls, channel rail,
  timeline ruler, waveform viewport, scrolling/zoom controls, meters, and
  floating/docked tools.
- Recover layout dimensions, visual tokens, responsive behavior, and interaction
  states from the last pre-deletion implementation and the accepted reference
  screenshots. Historic sources are read-only design evidence; no ordered
  scripts, IIFEs, globals, iframe route, or direct-DOM runtime may return.
- Retain the existing React controller, typed audio engine, menus, effects,
  analyzers, markers, project persistence, localization, themes, keyboard
  commands, and accessibility contracts. Visual parity must not reduce native
  functionality.
- Replace generic text controls in the persistent chrome with accessible icon
  controls and tooltips while keeping visible text in menus and dialogs.
- Verify desktop, wide desktop, tablet, narrow mobile, browser zoom, empty-state,
  loaded stereo waveform, menu, dialog, dark-theme, and light-theme states.
  Automated screenshots and structural assertions must cover the shell regions;
  console-free rendering and no horizontal page overflow remain required but
  are not sufficient on their own.
- Stage 15 may close only when the production `/editor` screenshot is recognizably
  the same AudioMass workspace as the reference interface and the complete
  release gate still passes.

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
- [x] Wave E: E.1 revision-aware waveform/track presentation, E.2 native
      menus/analyzers/workspace composition, and E.3 production promotion,
      responsive/keyboard/localization parity, and browser proof are complete.
- [x] Wave F: Nest operation DTOs and FastAPI discriminated jobs are implemented;
      the compatibility runtime, route, assets, globals, host adapters, build
      hooks, and configuration exceptions were deleted in `89e1d83`.
- [x] Wave G: all 12 tracked documents are synchronized; documentation
      integrity, final inventories, zero-vulnerability dependency audits, full
      builds/tests, Prisma/OpenAPI proof, and production browser smoke are
      complete.
- [x] Wave H: the exact `cdd2efc` AudioMass interface hierarchy and stylesheet
      stack are restored in the native React composition. Empty and loaded
      waveform/multitrack states, themes, interactions, narrow layout, tests,
      type checking, lint, and the production build are verified.

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

### Stage 10 — Wave E.1 waveform and track presentation

- **Status:** complete on 2026-08-02. Scope was committed and pushed first as
  `6b01f1e` (`Plan native editor presentation Wave E`); the commit containing
  this report is the E.1 implementation checkpoint
  (`Complete framework-native editor Wave E.1`).
- **Delivered:** a revision-aware single-track presentation contract;
  worker-backed combined and per-channel peak extraction; responsive Canvas
  waveform renderers; pure viewport/ruler/time mapping; overview, 1x..32x zoom,
  scroll, playhead, pointer/keyboard seek, drag selection, and marker overlays;
  and localized semantic controls. The multitrack workspace now renders a
  responsive ruler, track lanes, positioned clips, fades, crossfade state, and
  playhead beside its existing typed mixer/transport consumers. The obsolete
  range-only `Timeline` component was deleted and its reusable formatter moved
  into a presentation-independent module.
- **Compatibility result:** the existing combined `extractWaveformPeaks` API is
  preserved while the new discriminated worker request adds full analysis.
  Worker transfers use owned PCM copies, correlate responses, reject pending
  work on destruction, and let React ignore stale revision/size/zoom results.
  `EditorSession.audioRevision` changes only when rendered PCM changes, so
  playback position, markers, selection, and other document updates never
  recompute peaks. Preview PCM is intentionally visible to the waveform while
  export/history continue to read the committed audio document.
- **Automated proof:** audio-engine has 22 passing test files / 88 tests; web has
  26 passing test files / 94 tests; the complete JavaScript/TypeScript suite has
  65 files / 223 tests. New tests cover channel/overview peak parity, worker
  correlation and PCM ownership, revision stability, preview restoration,
  controller lazy lifecycle, viewport mapping, ruler ticks, and the native
  presentation import boundary. Repository formatting, lint, TypeScript
  typecheck, Prisma generation, all tests, and all production builds passed.
  Python Black, Ruff, strict mypy, and all 35 pytest cases passed with 87.14%
  coverage using isolated local temp/cache directories.
- **Architectural result:** the audio package owns immutable peak analysis and
  worker protocol; the Next.js controller owns the lazy worker lifecycle; React
  owns responsive structure, gestures, and typed command dispatch; Canvas owns
  pixels only. No new module imports the classic runtime, DOM builders, editor
  globals, iframe messaging, or legacy HTML routes.
- **Remaining after stage:** E.2 replaces production menu/analyzer/docking gaps
  with accessible React composition and typed analysis ports. E.3 then completes
  browser/responsive parity and promotes the native shell to `/editor`; Wave F
  performs the atomic compatibility-runtime deletion only after that proof.

### Stage 11 — Wave E.2 menus, analyzers, and workspace composition

- **Status:** complete on 2026-08-02. Scope was committed and pushed first as
  `62ab4dc` (`Plan native editor analysis and menus`); the commit containing this
  report is the E.2 implementation checkpoint
  (`Complete framework-native editor Wave E.2`).
- **Delivered:** deterministic bounded FFT/STFT analysis with frequency-spectrum
  and frame-major spectrogram contracts; a request-correlated worker protocol
  and lazy controller port; localized React frequency and spectral panels with
  responsive Canvas rendering, summaries, controls, loading/error states, and
  stale-result rejection; an accessible File/Edit/View menu bar backed by typed
  editor commands; and a single registered workspace that composes waveform,
  frequency, spectral, and native multitrack mixer panels. The native App Router
  page validates its optional panel query on the server and passes only the
  serializable registry value into the client shell.
- **Compatibility result:** native menus and analyzers do not navigate to
  classic HTML pages, import `/tools/*` adapters, access `PKAudioEditor`, or
  mutate a document-global editor object. The behavior-complete compatibility
  editor and its `/tools/*` routes remain isolated and unchanged until E.3 proves
  production parity and Wave F deletes that entire boundary atomically. Worker
  requests transfer owned PCM copies, correlate concurrent responses, reject
  pending work on disposal, and never recompute from transport-only updates.
- **Automated proof:** audio-engine has 24 passing test files / 91 tests; web has
  27 passing test files / 97 tests; the complete JavaScript/TypeScript suite has
  68 files / 229 tests. New tests cover sine-peak accuracy, bounded option
  validation, Nyquist capping, phase-cancelling channel downmix, finite
  spectrogram layout, worker PCM ownership/correlation/disposal, controller
  lifecycle, panel query validation, and the no-compatibility-import boundary.
  Repository formatting, lint, TypeScript typecheck, Prisma generation, all
  tests, and all production builds passed. Python Black, Ruff, strict mypy, and
  all 35 pytest cases passed with 87.14% coverage using isolated local
  temp/cache directories.
- **Architectural result:** the framework-independent audio package owns
  numerical analysis and worker contracts; the Next.js application controller
  owns lazy browser-worker lifecycle; the App Router owns validated initial
  route state; React owns accessible menu/panel structure and typed commands;
  Canvas owns pixels only. Spectrogram rendering is device-pixel-ratio correct
  and precomputes frequency/frame lookup arrays to avoid per-pixel search and
  tuple allocation.
- **Remaining after stage:** E.3 completes keyboard/focus and responsive browser
  parity, promotes the native shell to `/editor`, and records the production
  route proof. Wave F can then delete `apps/web/editor-runtime`, bridge/manifest
  compilation, temporary tool/mixer adapters, generated compatibility assets,
  and patch CSS as one verified change.

### Stage 12 — Wave E.3 production promotion and browser parity

- **Status:** complete on 2026-08-02. Scope was committed and pushed first as
  `03a2e6a` (`Plan native editor production promotion`); the commit containing
  this report is the E.3 implementation checkpoint
  (`Complete framework-native editor Wave E.3`).
- **Delivered:** production `/editor` is now a Server Component entry that
  awaits validated preferences and panel query state before rendering
  `EditorShell` directly. `/editor/native` is a validated redirect rather than
  a second composition. Typed panel selection writes the canonical URL through
  the Next.js-compatible History API without remounting editor state. The React
  menu now provides roving focus, wrapped Arrow/Home/End navigation,
  first/last popup entry, Escape focus restoration, disabled-item skipping,
  semantic separators, and App Router Settings/About links. English/Russian
  catalogs now own navigation, engine states, fallback errors, and notification
  accessibility copy. Responsive layout clamps menus at 320 CSS pixels, wraps
  controls, gives coarse pointers usable targets, scales analyzer Canvas height,
  and keeps effect dialogs centered and internally scrollable. Managed dialog
  cancellation prevents the native Escape/React state race and restores focus.
- **Compatibility result:** `/editor` no longer imports `EditorFrame`, iframe
  bridge code, classic runtime assets, global editor facades, `/tools/*`
  adapters, or old HTML pages. `apps/web/editor-runtime`, `/editor-runtime`, its
  build/manifest/bridge, generated assets, fallback tools, and temporary mixer
  adapter remain unchanged and isolated without a production editor consumer;
  Wave F deletes that complete boundary atomically instead of mixing deletion
  into route promotion.
- **Browser proof:** Chromium verified `/editor` at 1440×900, 768×1024,
  390×844, and the 320×720 minimum without page-level horizontal overflow,
  framework overlays, console errors, or failed application requests. Keyboard
  traversal covered File/Edit/View/Help/Settings, popup wrapping, disabled
  commands, Escape restoration, About navigation, and every waveform,
  frequency, spectral, and mixer panel URL. A Russian/default to English/
  `github-light` settings round trip updated document language, metadata,
  color scheme, and theme tokens. Loading the real `test.mp3` fixture proved
  waveform rendering, selection, centered effect-dialog focus, and non-blocking
  Escape close with focus returned to the Effects trigger. The native redirect
  preserved a validated mixer panel query.
- **Automated proof:** audio-engine has 24 passing test files / 91 tests; web has
  29 passing test files / 102 tests; the complete JavaScript/TypeScript suite has
  70 files / 234 tests. New tests cover production route ownership and redirect
  isolation, typed menu wrapping/popup selection, preference localization, and
  the no-compatibility-import boundary. Repository formatting, lint, TypeScript
  typecheck, Prisma generation, all tests, and every production build passed.
  Python Black, Ruff, strict mypy, and all 35 pytest cases passed with 87.14%
  coverage using an isolated local temp/cache directory.
- **Architectural result:** App Router owns validated initial route and
  preference state; React owns production editor composition, accessible
  interaction, and responsive presentation; typed controllers and the audio
  package retain command/DSP ownership; browser history changes panel address
  state without duplicating or rebuilding the editor. Wave E is complete.
- **Remaining after stage:** Wave F inventories and deletes the unconsumed
  compatibility runtime, route, compiler, iframe bridge, globals, fallback tool
  adapters, generated assets, tests, and patch CSS. Wave G then synchronizes the
  final post-deletion documentation and records release/deployment proof.

### Stage 13 — Wave F atomic compatibility deletion

- **Status:** complete on 2026-08-03. Scope and the measured deletion inventory
  were committed and pushed first as `23f21a5` (`Plan compatibility runtime
deletion`); the commit containing this report is the Wave F implementation
  checkpoint (`Delete compatibility runtime Wave F`).
- **Delivered:** the complete 116-file `apps/web/editor-runtime` tree
  (16,893,660 bytes), `/editor-runtime` Route Handler, `EditorFrame`, iframe
  bridge/document/manifest helpers, serial bridge queue, fallback React tool
  hosts, mixer global adapter, classic runtime tests, compiler/copy tooling,
  runtime-only ESLint/TypeScript/Turbo/gitignore rules, generated
  `public/editor-assets`, the unused vendor gateway, and its unreachable bundled
  assets were deleted together. The three established `/tools/*` URLs now use
  Server Component redirects to registered native panels. App Router owns a
  typed manifest and icon metadata; the native shell registers the root service
  worker, excludes API responses from caching, and receives explicit completion
  confirmation after observed Next.js resources are cached.
- **Compatibility result:** `/editor` remains the only editor composition and
  `/editor/native` remains a validated redirect. Existing frequency, spectral,
  and mixer URLs preserve navigation compatibility without client hosts,
  globals, query bridges, iframe messaging, or old HTML pages. Strict Mode
  browser proof exposed a controller-lifecycle race in which the development
  setup-cleanup-setup probe closed a reused audio graph; a tested deferred
  lifetime now cancels only that immediate probe and still disposes both native
  controllers after a real unmount.
- **Browser proof:** the optimized Next.js build was served in Chromium at
  1440×900 and the 320×720 minimum with no horizontal overflow, framework
  overlay, console error, or failed application request. All three legacy tool
  URLs reached their typed panels; `/manifest.webmanifest`, `/icon.svg`, and
  `/sw.js` returned 200; one root service worker created `audiomass-app-v5` and
  reloaded `/editor` successfully with the network disabled. A Russian/default
  to English/`github-light` settings round trip changed the document locale and
  editor tokens. An in-memory PCM WAV reached Ready, rendered a waveform,
  selected the full range, opened the native effect dialog, and restored focus
  after Escape. `/editor-runtime` returned the required 404.
- **Automated proof:** repository formatting, lint, strict TypeScript, Prisma
  generation, and every production build passed. The JavaScript/TypeScript
  suite has 52 passing files / 167 tests: audio-engine 24/91, Web 11/35, NestJS
  13/32, plugin SDK 3/8, and database 1/1. The production route table contains
  `/editor`, `/editor/native`, the manifest, and all three redirects but no
  `/editor-runtime`. Python Black and Ruff passed; strict mypy covers 47 source
  files; all 35 pytest cases passed with 87.14% coverage and the public OpenAPI
  contract test remained green.
- **Architectural result:** no first-party classic editor runtime remains in the
  repository or Web build. Next.js/React own routes and presentation,
  controller/session modules own application lifecycle, `@audiomass/audio-engine`
  owns browser audio behavior, and the service worker caches only the native
  application boundary. There is no compatibility code path to revive
  accidentally through configuration or a fallback URL.
- **Remaining after stage:** Wave G performs the final documentation-wide
  consistency pass, records the post-deletion source/config inventory and
  deployment proof, then closes the structural rewrite plan.

### Stage 14 — Wave G documentation and release closure

- **Status:** complete on 2026-08-03. Scope was committed and pushed first as
  `a2c3198` (`Plan final documentation release wave`); the commit containing
  this report is the Wave G implementation checkpoint (`Close framework-native
editor migration Wave G`).
- **Delivered:** all 12 tracked Markdown documents were reviewed against the
  post-Wave-F tree and updated with current routes, commands, ownership,
  deployment, operations, security, archival, and release contracts. The root
  `docs:check` command validates the canonical document set, level-one headings,
  and local inline link targets; CI now runs it after formatting. The final
  check covered 12 documents and 23 local links. Historical runtime and vendor
  names remain only in explicitly marked migration/license records.
- **Dependency result:** the release audit exposed 18 advisories (10 high and 8
  moderate) in the previous lockfile. Direct compatible updates moved Next.js
  to 16.2.12, React/React DOM to 19.2.8, Prisma to 7.9.1, Fastify static to
  10.1.2, Fastify rate-limit to 11.2.0, and typescript-eslint to 8.65.0;
  reviewed pnpm overrides pin patched transitive Hono, brace-expansion,
  find-my-way, js-yaml, PostCSS, Sharp, and Valibot releases. Frozen install is
  reproducible and both `pnpm audit --audit-level moderate` and Python
  `pip-audit` now report no known vulnerabilities. The production pnpm license
  inventory and Python `pip check` also completed successfully.
- **Final inventory:** tracked sources contain 208 `.ts`, 30 `.tsx`, and 47
  `.py` files. The only tracked `.js` is `apps/web/public/sw.js`, the native PWA
  service-worker entrypoint. Searches across production `apps`, `packages`, and
  `tooling` found no `PKAudioEditor`, `PKAudioFX`, runtime manifest,
  `editor-runtime`, `editor-assets`, `LegacyEditor`, or `module: none` symbols;
  the three removed runtime paths are absent. The repository contains the three
  documented applications, four shared packages, and three valid application
  `vercel.json` files.
- **Automated proof:** formatting, documentation integrity, ESLint, strict
  TypeScript, Prisma 7.9.1 validate/generate, and every production build passed.
  The JavaScript/TypeScript suite remains 52 passing files / 167 tests:
  audio-engine 24/91, Web 11/35, NestJS 13/32, plugin SDK 3/8, and database 1/1.
  Black checked 47 Python files; Ruff and strict mypy passed; all 35 pytest cases
  passed with 87.14% coverage. FastAPI `/openapi.json` remained covered by its
  public contract test. A production NestJS process served a 21-path OpenAPI
  document and healthy liveness response with the upgraded Fastify stack. The
  optimized Next.js route table contains `/editor`, `/editor/native`, the
  manifest, and all three tool redirects, with no `/editor-runtime` route.
- **Browser proof:** optimized Next.js 16.2.12 was served to headless Chromium.
  `/editor` loaded without console/page errors; desktop and 320×720 layouts had
  no page-level horizontal overflow. `/editor/native` and all three `/tools/*`
  URLs reached their typed panels, while `/editor-runtime` returned the required 404. The preferences API accepted English/`github-light`, the reloaded React
  shell rendered the English locale and light theme token, manifest/icon/service
  worker returned 200, `audiomass-app-v5` became active, and `/editor` reloaded
  successfully offline.
- **Resolved local verification conditions:** a protected global Windows pytest
  temp/cache directory initially caused `WinError 5`; the documented ignored
  workspace temp boundary and disabled pytest cache produced the clean 35-test
  run. Docker is not installed in this workstation, so container-image builds
  remain a release-environment check; Vercel application builds/configuration
  and both service runtime contracts were verified locally.
- **Architectural result:** Waves A–G and all fourteen structural stages are
  complete at the framework and runtime boundary. Documentation, CI, source
  inventory, dependency state, route output, and service schemas prove one
  framework-native editor boundary, but the production React composition does
  not yet preserve the original AudioMass interface.
- **Remaining after stage:** Wave H restores presentation parity without
  restoring the deleted compatibility runtime.

### Stage 15 — Wave H original-interface restoration

- **Status:** complete on 2026-08-03. The rejected generic form-and-card editor
  has been replaced with the exact historical AudioMass presentation contract
  from commit `cdd2efc`, while React, the typed controllers, and the native audio
  engine remain the only executable application/runtime owners.
- **Recovered source contract:** the 29 first-party stylesheets referenced by
  the historical `src/index.html` are mounted in their original order. Twenty
  eight files are content-identical after line-ending normalization;
  `main.css` differs only by embedding the original Icomoon WOFF payload instead
  of using its former relative font URL. A separate, narrowly scoped
  `react-bridge.css` supplies only React host sizing, canvas stacking, and
  runtime-state selectors.
- **React mapping:** `EditorMenuBar` owns the historical application header and
  menus; `TransportBar` owns the time badge, transport/edit groups, overview,
  marker/name, selection, and BPM chrome; `WaveformWorkspace` owns the panner,
  channel rows, ruler, waveform/selection/playhead canvases, empty state, and
  footer; `MultitrackPanel` owns the historical track rail, ruler, lanes, clips,
  controls, and shared footer. Theme data, localization, keyboard commands,
  effects, markers, audio loading, playback, project persistence, and export
  continue through framework-native stores/controllers rather than restored
  IIFEs, globals, ordered scripts, iframes, or direct-DOM legacy modules.
- **Geometry and responsive proof:** at the 2048 x 1047 reference viewport the
  restored shell reproduces the 32 px header, 66 px toolbar, 877 px workspace,
  and 72 px footer. The empty single-track screenshot differs from the exact
  `cdd2efc` render by 1.63% of pixels (98.37% match); the multitrack empty state
  differs by 6.83%, with the same full workspace geometry and 178 px track rail.
  Remaining differences are dynamic canvas/text rasterization, not a redesigned
  layout. A 1365 x 768 viewport has zero document overflow; the historically
  wide toolbar remains horizontally scrollable inside its own container.
- **Interaction and theme proof:** a real mono WAV loads with a 1.000 second
  duration and visible waveform; the same file creates a functional multitrack
  track and clip. Selection drag produced start `00:00.127`, end `00:00.359`,
  and duration `00:00.232`. Header effects open native React dialogs, Escape
  closes them, transport state is connected in both modes, and `github-light`
  recolors the complete editor before returning to the default `replicate`
  theme. Fresh-server browser verification completed without hydration errors,
  console errors, or page overflow.
- **Automated acceptance:** `@audiomass/audio-engine` builds; web ESLint passes
  with zero warnings; web Vitest passes 11 files / 35 tests; web TypeScript
  checking passes; and the Next.js 16.2.12 production build succeeds with all
  application and editor routes intact. The implementation checkpoint is
  `e594db2`; the stage report and both commits are pushed explicitly to
  `origin/agent/repository-hardening`.

## Overall stage summary

| Wave | State    | Current result                                                                   |
| ---- | -------- | -------------------------------------------------------------------------------- |
| A    | Complete | Typed application/domain platform and React lifecycle                            |
| B    | Complete | Leaf services, metadata, workers, persistence adapters, and vendor isolation     |
| C    | Complete | PCM-aware history, playback proof, edit commands, recording, and WAV export UI   |
| D    | Complete | Native multitrack/effect domain, workflows, playback, persistence, and export    |
| E    | Complete | Native production route, React presentation, accessibility, and browser parity   |
| F    | Complete | Compatibility runtime, globals, assets, tool hosts, and build hooks are deleted  |
| G    | Complete | Documentation, audits, inventories, schemas, builds, and release proof are final |
| H    | Complete | Exact `cdd2efc` AudioMass presentation restored in native React                  |

All fifteen structural stages and Waves A-H are complete. The first-party
classic editor runtime and every route, global, generated runtime asset, host
adapter, and configuration exception that could execute it remain deleted. The
historical `cdd2efc` presentation is now preserved as an explicit stylesheet and
DOM contract implemented by native React components over the typed editor
controllers. The result restores the established AudioMass interface without
reviving the legacy implementation boundary.
