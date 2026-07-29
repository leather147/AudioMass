export type EditorVendorAssetId =
  | 'flac-encoder'
  | 'flac-runtime'
  | 'lz4-dispatcher'
  | 'lz4-runtime'
  | 'mp3-encoder'
  | 'noise-suppressor'
  | 'waveform-core'
  | 'waveform-regions';

export interface EditorVendorAsset {
  id: EditorVendorAssetId;
  kind: 'script' | 'support' | 'worker';
  path: `/editor-assets/${string}`;
}

export const EDITOR_VENDOR_ASSETS = {
  flacEncoder: {
    id: 'flac-encoder',
    kind: 'worker',
    path: '/editor-assets/flac.js',
  },
  flacRuntime: {
    id: 'flac-runtime',
    kind: 'support',
    path: '/editor-assets/libflac.js',
  },
  lz4Dispatcher: {
    id: 'lz4-dispatcher',
    kind: 'script',
    path: '/editor-assets/lzma.js',
  },
  lz4Runtime: {
    id: 'lz4-runtime',
    kind: 'support',
    path: '/editor-assets/lz4-block-codec-wasm.js',
  },
  mp3Encoder: {
    id: 'mp3-encoder',
    kind: 'worker',
    path: '/editor-assets/lame.js',
  },
  noiseSuppressor: {
    id: 'noise-suppressor',
    kind: 'script',
    path: '/editor-assets/rnn_denoise.js',
  },
  waveformCore: {
    id: 'waveform-core',
    kind: 'script',
    path: '/editor-assets/dist/wavesurfer.js',
  },
  waveformRegions: {
    id: 'waveform-regions',
    kind: 'script',
    path: '/editor-assets/dist/plugin/wavesurfer.regions.js',
  },
} as const satisfies Record<string, EditorVendorAsset>;

export const EDITOR_VENDOR_ASSET_LIST: readonly EditorVendorAsset[] =
  Object.values(EDITOR_VENDOR_ASSETS);
