import type { EditorCopyKey } from '@/lib/editor-copy';

export const EDITOR_PANEL_IDS = ['waveform', 'frequency', 'spectral', 'mixer'] as const;

export type EditorPanelId = (typeof EDITOR_PANEL_IDS)[number];

export const EDITOR_PANEL_LABELS: Record<EditorPanelId, EditorCopyKey> = {
  frequency: 'frequencyAnalyser',
  mixer: 'multitrackMixer',
  spectral: 'spectralAnalyser',
  waveform: 'waveform',
};

export function parseEditorPanel(value: string | null | undefined): EditorPanelId {
  return EDITOR_PANEL_IDS.find((panel) => panel === value) ?? 'waveform';
}
