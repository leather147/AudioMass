# Editor runtime rewrite plan

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

After the first leaf-module batch and the AMSS codec migration:

- 31 first-party classic JavaScript files remain;
- approximately 26,465 first-party JavaScript lines remain;
- 11 strict TypeScript runtime modules are generated into /editor-assets;
- LUFS, tempo analysis, WAV export, and AMSS project files have behavioral tests.

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

## Migration rules

1. Move leaf modules before stateful orchestrators.
2. Preserve observable behavior and established `PKAudioEditor`/`PKAudioFX`
   facades until all consumers are typed.
3. Add a named typed service even when a temporary global facade is required.
4. Add numerical or behavioral contract tests before deleting the old script.
5. Keep worker, codec, media, and relative URL behavior unchanged.
6. Remove each migrated filename from `EDITOR_RUNTIME_SCRIPTS`; never load old
   and new implementations together.
7. Run runtime build, lint, typecheck, tests, production build, and browser smoke
   checks after every wave.

## Waves

### Wave 1 — leaf audio and format utilities

- [x] `lufs.js` -> typed loudness analysis service.
- [x] `tempo-estimator.js` and `tempo-worker.js` -> typed tempo analysis pair.
- [x] `wav.js` -> typed WAV encoder.
- [x] `amss-format.js` -> typed project format codec.
- [ ] `id3.js` -> typed metadata parser/writer.
- [ ] `local.js` -> typed local project repository.

### Wave 2 — small runtime and presentation services

- [ ] `oneup.js` and `menu-check-svg.js`.
- [ ] theme registry/canvas and appearance modules.
- [ ] welcome and settings trigger modules.
- [ ] marker/clip/composition toolbar extensions.
- [ ] multitrack scroll and touch selection extensions.

### Wave 3 — state and interaction

- [ ] `app.js` and `state.js`.
- [ ] `keys.js`, `markers.js`, and `contextmenu.js`.
- [ ] `drag.js`.
- [ ] `recorder.js` and `recorder-worklet.js`.

### Wave 4 — effects and dialogs

- [ ] `modal.js`.
- [ ] `fx-auto.js`.
- [ ] `fx-pg-eq.js`.
- [ ] `ui-fx.js`.

Every effect keeps its current parameter names, ranges, preview behavior,
presets, cancellation semantics, and undo transaction boundary.

### Wave 5 — editor cores

- [ ] finish extracting `actions.js` and delete its facade.
- [ ] migrate `engine.js`.
- [ ] migrate `ui.js`.
- [ ] migrate `multitrack.js`.

These modules are migrated last because they own initialization order and most
cross-module event contracts.

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
