# Editor runtime source-language migration record

> This record describes the completed JavaScript-to-TypeScript compatibility
> migration. It is not the plan for removing the legacy architecture. Continue
> with [FRAMEWORK_NATIVE_EDITOR_PLAN.md](FRAMEWORK_NATIVE_EDITOR_PLAN.md).

## Baseline

The structural migration is fixed in commit `784afe1`. It removed the public
legacy boundary, retired standalone HTML tools, centralized preferences and
localization, and introduced a reproducible `/editor-assets` build.

The remaining rewrite starts from this measured baseline:

- 36 first-party classic JavaScript files;
- approximately 27,407 first-party JavaScript lines;
- 8 third-party or generated JavaScript assets kept outside the rewrite scope;
- 6 typed runtime modules already generated before development, tests, and builds.

The line count is only a progress indicator. A module is complete when its old
file is deleted, its replacement has strict types and tests, and the runtime
manifest loads only the replacement.

## Current checkpoint

After completing the final wave:

- 0 first-party classic JavaScript files remain;
- 43 TypeScript runtime modules are generated into `/editor-assets`;
- the only JavaScript sources under `editor-runtime/static` are the 8 documented vendor assets;
- the runtime manifest loads every first-party module from the reproducible TypeScript build;
- contract tests cover the final-wave inventory, editor event bus and math helpers, bounded undo/redo history, keyboard callbacks, and recorder worklet protocol;
- LUFS, tempo analysis, WAV export, AMSS project files, local session storage, ID3/MP4 metadata, themes, localization, presentation services, and appearance UI retain their behavioral tests.

## Scope boundary

First-party runtime behavior must move from `editor-runtime/static/*.js` to
strict TypeScript under `editor-runtime/`. Static CSS, fonts, media, WebAssembly,
and worker data remain assets. The following upstream/generated scripts are
vendor dependencies and are isolated rather than rewritten:

- `dist/wavesurfer.js`;
- `dist/plugin/wavesurfer.regions.js`;
- `lame.js`;
- `libflac.js` and `flac.js`;
- `lzma.js` and `lz4-block-codec-wasm.js`;
- `rnn_denoise.js`.

Vendor files may only be referenced through an explicit allowlist in the runtime
manifest and notices. Any local patch to them must be documented.

The framework-native editor additionally isolates the same eight assets behind
`features/editor/infrastructure/LegacyEditorVendorGateway`. The gateway owns
their absolute URLs, script ordering, classic worker construction, and runtime
shape validation. New React, controller, and audio-domain modules must never
read the vendor globals directly.

## Migration rules

1. Move leaf modules before stateful orchestrators.
2. Preserve observable behavior and established `PKAudioEditor`/`PKAudioFX`
   facades until all consumers are typed.
3. Add a named typed service even when a temporary global facade is required.
4. Add numerical or behavioral contract tests before deleting the old script.
5. Keep worker, codec, media, and relative URL behavior unchanged.
6. Replace each migrated filename in `EDITOR_RUNTIME_SCRIPTS` with its generated
   `/editor-assets` path; never load old and new implementations together.
7. Run runtime build, lint, typecheck, tests, production build, and browser smoke
   checks after every wave.

## Waves

### Wave 1 — leaf audio and format utilities

- [x] `lufs.js` -> typed loudness analysis service.
- [x] `tempo-estimator.js` and `tempo-worker.js` -> typed tempo analysis pair.
- [x] `wav.js` -> typed WAV encoder.
- [x] `amss-format.js` -> typed project format codec.
- [x] `id3.js` -> typed metadata parser/writer.
- [x] `local.js` -> typed local project repository.

### Wave 2 — small runtime and presentation services

- [x] `oneup.js` and `menu-check-svg.js`.
- [x] theme registry/canvas and appearance modules.
- [x] welcome and settings trigger modules.
- [x] Russian locale dictionary.
- [x] marker/clip/composition toolbar extensions.
- [x] multitrack scroll, single-waveform view, and touch selection extensions.

### Final Wave — complete first-party runtime migration

This wave consolidates the former Waves 3–5. It is complete only when all 16
remaining first-party JavaScript sources are deleted and their typed replacements
are loaded by the runtime manifest.

#### State, interaction, and recording

- [x] `app.js` and `state.js`.
- [x] `keys.js`, `markers.js`, and `contextmenu.js`.
- [x] `drag.js`.
- [x] `recorder.js` and `recorder-worklet.js`.

#### Effects and dialogs

- [x] `modal.js`.
- [x] `fx-auto.js`.
- [x] `fx-pg-eq.js`.
- [x] `ui-fx.js`.

Every effect keeps its current parameter names, ranges, preview behavior,
presets, cancellation semantics, and undo transaction boundary.

#### Editor cores

- [x] finish extracting `actions.js` and delete its facade.
- [x] migrate `engine.js`.
- [x] migrate `ui.js`.
- [x] migrate `multitrack.js`.

These modules are migrated last because they own initialization order and most
cross-module event contracts.

The six state/interaction/recording modules use narrow explicit interfaces. The
ten large classic-runtime modules compile under the same strict TypeScript
configuration while preserving function scoping, callback shapes, global
facades, and initialization order. Their ESLint compatibility override is
limited to those exact files so future modules cannot inherit the classic syntax
rules accidentally.

## Completion criteria

- No first-party `.js` files remain under `editor-runtime/static`.
- The runtime manifest contains only generated typed modules plus the documented
  vendor allowlist.
- No retired HTML routes, duplicate dictionaries, direct UI storage access, or
  reload-based locale changes return.
- Existing editor, effects, recording, import/export, markers, multitrack,
  themes, localization, analyzers, and PWA behavior pass automated and browser
  parity checks.
- Full JavaScript/TypeScript, Python, production build, and dependency audit
  pipelines remain green.

These criteria prove source-language migration only. The modules still preserve
classic initialization order and global facades; structural completion requires
deleting this runtime after React/audio-engine parity, as defined by the
framework-native plan.

At the current structural checkpoint, the native editor has completed Waves A-D.
Its application services own PCM-aware single-track history, all primary and
specialized effect transactions, copied multitrack sources, project scheduling,
Web Audio routing/playback, complete local documents, and deterministic WAV
export. React owns the native transport, effect, and mixer consumers without
editor globals. The compatibility runtime remains only as the behavior-complete
production presentation while Wave E ports waveform/track lanes, menus,
analysers, and docking; Wave F then deletes that boundary atomically.
