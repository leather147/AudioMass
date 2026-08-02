import { describe, expect, it } from 'vitest';

import {
  EDITOR_PANEL_IDS,
  EDITOR_PANEL_LABELS,
  parseEditorPanel,
} from '@/features/editor/components/workspace/editor-panels';

describe('native editor panel registry', () => {
  it('keeps every menu panel registered and rejects unknown route input', () => {
    expect(EDITOR_PANEL_IDS).toEqual(['waveform', 'frequency', 'spectral', 'mixer']);
    expect(Object.keys(EDITOR_PANEL_LABELS).sort()).toEqual([...EDITOR_PANEL_IDS].sort());
    expect(parseEditorPanel('frequency')).toBe('frequency');
    expect(parseEditorPanel('eq.html')).toBe('waveform');
    expect(parseEditorPanel(undefined)).toBe('waveform');
  });
});
