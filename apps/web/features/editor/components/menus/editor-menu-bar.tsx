'use client';

import Link from 'next/link';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { EditorSessionSnapshot } from '@audiomass/audio-engine';
import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import {
  EDITOR_TOP_LEVEL_MENU_IDS,
  isEditorPopupMenu,
  moveMenuIndex,
  movePopupMenuIndex,
  type EditorPopupMenuId,
} from './editor-menu-model';
import {
  EDITOR_PANEL_IDS,
  EDITOR_PANEL_LABELS,
  type EditorPanelId,
} from '../workspace/editor-panels';
import styles from '../editor-shell.module.css';

interface EditorMenuBarProps {
  activePanel: EditorPanelId;
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  onError(message: string | null): void;
  onFileInput(event: ChangeEvent<HTMLInputElement>): void;
  onPanelChange(panel: EditorPanelId): void;
  snapshot: EditorSessionSnapshot;
}

type PopupFocusEdge = 'first' | 'last';

function enabledPopupItems(popup: Element): HTMLElement[] {
  return Array.from(
    popup.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)',
    ),
  );
}

export function EditorMenuBar({
  activePanel,
  controller,
  copy,
  onError,
  onFileInput,
  onPanelChange,
  snapshot,
}: EditorMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<EditorPopupMenuId | null>(null);
  const [topLevelIndex, setTopLevelIndex] = useState(0);
  const pendingPopupFocus = useRef<PopupFocusEdge | null>(null);
  const rootReference = useRef<HTMLElement>(null);
  const fileReference = useRef<HTMLInputElement>(null);
  const loaded = snapshot.engine.duration > 0;
  const selected = snapshot.document.selection !== null;

  const triggerAt = (index: number) =>
    rootReference.current?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`) ?? null;

  const focusTrigger = (index: number) => {
    setTopLevelIndex(index);
    queueMicrotask(() => triggerAt(index)?.focus());
  };

  const openAndFocus = (index: number, edge: PopupFocusEdge) => {
    const menu = EDITOR_TOP_LEVEL_MENU_IDS[index];
    if (!menu || !isEditorPopupMenu(menu)) return;
    setTopLevelIndex(index);
    pendingPopupFocus.current = edge;
    setOpenMenu(menu);
  };

  const closeAndRestoreFocus = () => {
    const currentIndex = openMenu ? EDITOR_TOP_LEVEL_MENU_IDS.indexOf(openMenu) : topLevelIndex;
    pendingPopupFocus.current = null;
    setOpenMenu(null);
    focusTrigger(Math.max(0, currentIndex));
  };

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootReference.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  useEffect(() => {
    const edge = pendingPopupFocus.current;
    if (!openMenu || !edge) return;
    const popup = rootReference.current?.querySelector(`[data-menu-popup="${openMenu}"]`);
    if (!popup) return;
    const items = enabledPopupItems(popup);
    pendingPopupFocus.current = null;
    (edge === 'first' ? items[0] : items.at(-1))?.focus();
  }, [openMenu]);

  const toggle = (menu: EditorPopupMenuId, index: number) => {
    pendingPopupFocus.current = null;
    setTopLevelIndex(index);
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const command = (action: () => void) => {
    closeAndRestoreFocus();
    action();
  };

  const exportAudio = async () => {
    closeAndRestoreFocus();
    onError(null);
    try {
      await controller.downloadWav();
    } catch (error) {
      onError(error instanceof Error ? error.message : copy('exportFailed'));
    }
  };

  const handleTopLevelKey = (event: ReactKeyboardEvent<HTMLElement>, target: HTMLElement) => {
    const rawIndex = target.dataset.menuIndex;
    if (rawIndex === undefined) return;
    const currentIndex = Number(rawIndex);
    if (!Number.isInteger(currentIndex)) return;
    const currentMenu = EDITOR_TOP_LEVEL_MENU_IDS[currentIndex];
    if (!currentMenu) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = moveMenuIndex(currentIndex, direction, EDITOR_TOP_LEVEL_MENU_IDS.length);
      const nextMenu = EDITOR_TOP_LEVEL_MENU_IDS[next]!;
      if (openMenu && isEditorPopupMenu(nextMenu)) openAndFocus(next, 'first');
      else {
        setOpenMenu(null);
        focusTrigger(next);
      }
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setOpenMenu(null);
      focusTrigger(event.key === 'Home' ? 0 : EDITOR_TOP_LEVEL_MENU_IDS.length - 1);
      return;
    }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && isEditorPopupMenu(currentMenu)) {
      event.preventDefault();
      openAndFocus(currentIndex, event.key === 'ArrowDown' ? 'first' : 'last');
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && isEditorPopupMenu(currentMenu)) {
      event.preventDefault();
      openAndFocus(currentIndex, 'first');
      return;
    }
    if (event.key === 'Escape' && openMenu) {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  };

  const handlePopupKey = (event: ReactKeyboardEvent<HTMLElement>, popup: Element) => {
    if (event.key === 'Tab') {
      setOpenMenu(null);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }
    const items = enabledPopupItems(popup);
    const currentIndex = items.indexOf(event.target as HTMLElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      items[moveMenuIndex(Math.max(0, currentIndex), direction, items.length)]?.focus();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? items[0] : items.at(-1))?.focus();
      return;
    }
    if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && openMenu) {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const currentMenuIndex = EDITOR_TOP_LEVEL_MENU_IDS.indexOf(openMenu);
      openAndFocus(movePopupMenuIndex(currentMenuIndex, direction), 'first');
    }
  };

  return (
    <nav
      aria-label={copy('mainMenu')}
      className={styles.menuBar}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const popup = target.closest('[role="menu"]');
        if (popup) handlePopupKey(event, popup);
        else handleTopLevelKey(event, target.closest<HTMLElement>('[data-menu-index]') ?? target);
      }}
      ref={rootReference}
      role="menubar"
    >
      <div className={styles.menuRoot} role="none">
        <button
          aria-controls="editor-menu-file"
          aria-expanded={openMenu === 'file'}
          aria-haspopup="menu"
          data-menu-index="0"
          onClick={() => toggle('file', 0)}
          onFocus={() => setTopLevelIndex(0)}
          role="menuitem"
          tabIndex={topLevelIndex === 0 ? 0 : -1}
          type="button"
        >
          {copy('fileMenu')}
        </button>
        {openMenu === 'file' ? (
          <div
            className={styles.menuPopup}
            data-menu-popup="file"
            id="editor-menu-file"
            role="menu"
          >
            <button
              onClick={() => command(() => fileReference.current?.click())}
              role="menuitem"
              type="button"
            >
              {copy('openAudio')}
            </button>
            <button
              disabled={!loaded}
              onClick={() => void exportAudio()}
              role="menuitem"
              type="button"
            >
              {copy('exportWav')}
            </button>
          </div>
        ) : null}
        <input accept="audio/*" hidden onChange={onFileInput} ref={fileReference} type="file" />
      </div>

      <div className={styles.menuRoot} role="none">
        <button
          aria-controls="editor-menu-edit"
          aria-expanded={openMenu === 'edit'}
          aria-haspopup="menu"
          data-menu-index="1"
          onClick={() => toggle('edit', 1)}
          onFocus={() => setTopLevelIndex(1)}
          role="menuitem"
          tabIndex={topLevelIndex === 1 ? 0 : -1}
          type="button"
        >
          {copy('editMenu')}
        </button>
        {openMenu === 'edit' ? (
          <div
            className={styles.menuPopup}
            data-menu-popup="edit"
            id="editor-menu-edit"
            role="menu"
          >
            <button
              disabled={!snapshot.canUndo}
              onClick={() => command(() => void controller.dispatch({ name: 'history.undo' }))}
              role="menuitem"
              type="button"
            >
              {copy('undo')}
            </button>
            <button
              disabled={!snapshot.canRedo}
              onClick={() => command(() => void controller.dispatch({ name: 'history.redo' }))}
              role="menuitem"
              type="button"
            >
              {copy('redo')}
            </button>
            <hr />
            <button
              disabled={!loaded}
              onClick={() => command(() => void controller.dispatch({ name: 'edit.select-all' }))}
              role="menuitem"
              type="button"
            >
              {copy('selectAll')}
            </button>
            <button
              disabled={!selected}
              onClick={() => command(() => void controller.dispatch({ name: 'edit.cut' }))}
              role="menuitem"
              type="button"
            >
              {copy('cut')}
            </button>
            <button
              disabled={!selected}
              onClick={() => command(() => void controller.dispatch({ name: 'edit.copy' }))}
              role="menuitem"
              type="button"
            >
              {copy('copy')}
            </button>
            <button
              disabled={!snapshot.clipboardFrames}
              onClick={() => command(() => void controller.dispatch({ name: 'edit.paste' }))}
              role="menuitem"
              type="button"
            >
              {copy('paste')}
            </button>
            <button
              disabled={!selected}
              onClick={() => command(() => void controller.dispatch({ name: 'edit.delete' }))}
              role="menuitem"
              type="button"
            >
              {copy('deleteSelection')}
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.menuRoot} role="none">
        <button
          aria-controls="editor-menu-view"
          aria-expanded={openMenu === 'view'}
          aria-haspopup="menu"
          data-menu-index="2"
          onClick={() => toggle('view', 2)}
          onFocus={() => setTopLevelIndex(2)}
          role="menuitem"
          tabIndex={topLevelIndex === 2 ? 0 : -1}
          type="button"
        >
          {copy('viewMenu')}
        </button>
        {openMenu === 'view' ? (
          <div
            className={styles.menuPopup}
            data-menu-popup="view"
            id="editor-menu-view"
            role="menu"
          >
            {EDITOR_PANEL_IDS.map((panel) => (
              <button
                aria-checked={panel === activePanel}
                key={panel}
                onClick={() => command(() => onPanelChange(panel))}
                role="menuitemradio"
                type="button"
              >
                <span aria-hidden="true">{panel === activePanel ? '✓' : ''}</span>
                {copy(EDITOR_PANEL_LABELS[panel])}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.menuRoot} role="none">
        <button
          aria-controls="editor-menu-help"
          aria-expanded={openMenu === 'help'}
          aria-haspopup="menu"
          data-menu-index="3"
          onClick={() => toggle('help', 3)}
          onFocus={() => setTopLevelIndex(3)}
          role="menuitem"
          tabIndex={topLevelIndex === 3 ? 0 : -1}
          type="button"
        >
          {copy('helpMenu')}
        </button>
        {openMenu === 'help' ? (
          <div
            className={styles.menuPopup}
            data-menu-popup="help"
            id="editor-menu-help"
            role="menu"
          >
            <Link href="/about" onClick={() => setOpenMenu(null)} role="menuitem">
              {copy('about')}
            </Link>
          </div>
        ) : null}
      </div>

      <Link
        className={styles.menuLink}
        data-menu-index="4"
        href="/settings"
        onFocus={() => setTopLevelIndex(4)}
        role="menuitem"
        tabIndex={topLevelIndex === 4 ? 0 : -1}
      >
        {copy('settingsMenu')}
      </Link>
    </nav>
  );
}
