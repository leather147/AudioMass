# Enterprise migration record

## Outcome

The repository moved from a static browser application with local-only persistence to a Turborepo workspace with an incremental Next.js shell, reusable browser audio packages, a versioned NestJS gateway, PostgreSQL persistence, provider-neutral object storage, and a private FastAPI processing service.

The editor was not rewritten in one unsafe step. Its framework-native path now
owns production `/editor` through React feature modules in Next.js and
framework-independent domain/application modules in
`@audiomass/audio-engine`; `/editor/native` redirects to the canonical route.
The former same-origin boundary remains isolated without a production consumer
until its atomic Wave F deletion. Transport DTOs and orchestration live in
NestJS, and discriminated processing contracts live in FastAPI. See
[FRAMEWORK_NATIVE_EDITOR_PLAN.md](FRAMEWORK_NATIVE_EDITOR_PLAN.md) for the live
inventory and removal gate.

## Commit sequence

1. `chore: initialize turborepo workspace`
2. `feat(web): migrate AudioMass UI to Next.js 16`
3. `feat(audio): extract browser audio engine`
4. `feat(plugin): create plugin sdk`
5. `feat(api): migrate backend modules to NestJS`
6. `feat(python): add FastAPI audio processing service`
7. `feat(storage): implement cloud storage`
8. `feat(ai): integrate python processing pipeline`
9. `docs: add migration documentation`

Each feature phase is independently reviewable and has package-level tests. The final commit adds deployment artifacts, CI, environment contracts, and the operator documentation needed to run the combined system.

## Important compatibility decisions

- Browser audio remains the default for interactive work; Python is reserved for bounded heavy operations.
- The web application calls only NestJS. FastAPI has no public browser contract.
- Direct browser uploads avoid routing large audio bodies through NestJS.
- Storage adapters share one lifecycle and verification contract.
- Project updates use optimistic concurrency, and processing creation supports idempotency.
- Browser plugins are capability-scoped packages; Python plugins are trusted server installations.
- Production editor sources live under `apps/web/features/editor` and `packages/audio-engine`. The isolated `apps/web/editor-runtime` compatibility boundary has no `/editor` consumer; its static vendor resources remain versioned under `editor-runtime/static`, while `public/editor-assets` is generated and ignored until Wave F.
- Frequency analysis, spectral analysis, the multitrack mixer, About, preference persistence, and offline installation now use App Router or root web-platform entrypoints; their superseded standalone HTML and AppCache files have been removed.
- The final static editor HTML entrypoint was replaced by the `/editor-runtime` Route Handler and a tested asset-order manifest. Relative worker, worklet, codec, and sample paths remain compatible through the runtime document base URL.
- Preference storage, locale application, theme application, and the editor bridge were moved from handwritten public scripts to typed `apps/web/editor-runtime` sources. Generated browser assets are rebuilt before web development, tests, and production builds.
- Production preference changes are validated through the App Router API and read from cookies by Server Components, eliminating iframe synchronization and stale locale writes on `/editor`; the old bridge remains scoped to the isolated compatibility route.
- Copy, trim, insert, silence, overwrite, and chunked-float operations were extracted from `actions.js` into the typed and unit-tested editor runtime. The existing AudioUtils method names remain as a compatibility facade.
- Shared gain routing, fade curves, peak/RMS normalization, and playback-rate profile calculations were extracted into a second typed and unit-tested runtime module. The effect bank still consumes its established local helper names and parameter shapes.
- A later structural wave introduced `EditorSession`, bounded typed history,
  marker/project domains, PCM/DSP/WAV modules, recording worklets, multitrack
  scheduling, React controller/store/components, and an IndexedDB project
  repository without adding new globals.
- The leaf-infrastructure wave completed native ID3/MP4 metadata, discriminated
  WAV and tempo worker protocols/clients, and a fail-closed Next.js gateway for
  all eight retained vendor assets.
- The single-track wave made PCM part of the bounded editor history, added pure
  copy/cut/paste/delete/trim/silence transactions with marker-time transforms,
  verified the Web Audio playback lifecycle with a fake graph, and exposed WAV
  export through encoder and browser-download ports in the React editor.
- The multitrack wave is complete: mixer/channel state, owned PCM sources,
  whole-project scheduling, disposable Web Audio routing/playback, equal-power
  crossfades, deterministic stereo bounce, complete IndexedDB documents, and
  localized React transport/mixer consumers now communicate through typed
  package and controller contracts. The old mixer host access is isolated in
  one temporary fallback adapter until the production presentation switches.
- The effect wave replaced DOM-order/comma-string contracts with discriminated
  schemas, typed presets, immutable primary processors, and explicit React
  workflows for seamless loop, paragraphic EQ, automation, and audio repair.
- NestJS and FastAPI now validate each remote operation with matching
  operation-specific contracts instead of passing generic parameter maps.

## Success criteria

The workspace is considered releasable when frozen dependency installation, formatting, lint, TypeScript typechecking, JavaScript/TypeScript tests, production builds, Prisma validation/generation, Black, Ruff, mypy, Python tests, and dependency checks all pass. Container builds should also run in the release environment where a Docker daemon is available.
