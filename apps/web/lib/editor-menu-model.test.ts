import { describe, expect, it } from 'vitest';

import {
  EDITOR_TOP_LEVEL_MENU_IDS,
  isEditorPopupMenu,
  moveMenuIndex,
  movePopupMenuIndex,
} from '@/features/editor/components/menus/editor-menu-model';

describe('native editor menu navigation model', () => {
  it('wraps roving focus in both directions', () => {
    expect(moveMenuIndex(0, -1, EDITOR_TOP_LEVEL_MENU_IDS.length)).toBe(6);
    expect(moveMenuIndex(6, 1, EDITOR_TOP_LEVEL_MENU_IDS.length)).toBe(0);
    expect(moveMenuIndex(2, 1, EDITOR_TOP_LEVEL_MENU_IDS.length)).toBe(3);
  });

  it('skips the direct settings link when switching open popups', () => {
    expect(EDITOR_TOP_LEVEL_MENU_IDS).toEqual([
      'file',
      'edit',
      'effects',
      'view',
      'help',
      'language',
      'settings',
    ]);
    expect(isEditorPopupMenu('help')).toBe(true);
    expect(isEditorPopupMenu('settings')).toBe(false);
    expect(movePopupMenuIndex(4, 1)).toBe(0);
    expect(movePopupMenuIndex(0, -1)).toBe(4);
  });
});
