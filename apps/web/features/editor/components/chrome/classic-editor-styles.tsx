const CLASSIC_EDITOR_STYLES = [
  'main.css',
  'replicate-theme.css',
  'mt-track-color-frames.css',
  'mt-infinite-grid.css',
  'ui-bugfixes.css',
  'mt-grid-soft.css',
  'mt-background-grid.css',
  'selection-badge.css',
  'interaction-cursors.css',
  'animation-system.css',
  'toolbar-badges-icons.css',
  'tooltip-layer.css',
  'mt-add-channel-bottom.css',
  'floating-safe-placement.css',
  'menu-dialog-chain.css',
  'timeline-extra-scroll.css',
  'toolbar-fluid-fix.css',
  'selection-panel-final-fix.css',
  'marker-head-centering.css',
  'toolbar-icons-restore.css',
  'composition-waveform-badge.css',
  'toolbar-time-transport-final-fix.css',
  'time-badge-no-crop.css',
  'mt-scroll-ruler-final-fix.css',
  'selection-panel-responsive-fix.css',
  'marker-create-button.css',
  'clip-rename-button.css',
  'appearance.css',
  'theme-overrides.css',
  'react-bridge.css',
] as const;

export function ClassicEditorStyles() {
  return CLASSIC_EDITOR_STYLES.map((file) => (
    <link href={`/editor-classic/${file}?v=cdd2efc-react-4`} key={file} rel="stylesheet" />
  ));
}
