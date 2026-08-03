export const EDITOR_TOP_LEVEL_MENU_IDS = [
  'file',
  'edit',
  'effects',
  'view',
  'help',
  'language',
  'settings',
] as const;

export type EditorTopLevelMenuId = (typeof EDITOR_TOP_LEVEL_MENU_IDS)[number];
export type EditorPopupMenuId = Exclude<EditorTopLevelMenuId, 'language' | 'settings'>;

const POPUP_MENU_IDS = new Set<EditorTopLevelMenuId>(['file', 'edit', 'effects', 'view', 'help']);

export function isEditorPopupMenu(value: EditorTopLevelMenuId): value is EditorPopupMenuId {
  return POPUP_MENU_IDS.has(value);
}

export function moveMenuIndex(current: number, direction: -1 | 1, length: number): number {
  if (length <= 0) return -1;
  return (Math.max(0, current) + direction + length) % length;
}

export function movePopupMenuIndex(current: number, direction: -1 | 1): number {
  let candidate = current;
  do {
    candidate = moveMenuIndex(candidate, direction, EDITOR_TOP_LEVEL_MENU_IDS.length);
  } while (!isEditorPopupMenu(EDITOR_TOP_LEVEL_MENU_IDS[candidate]!));
  return candidate;
}
