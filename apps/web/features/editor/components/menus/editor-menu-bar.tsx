'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { EditorSessionSnapshot } from '@audiomass/audio-engine';
import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import {
  EDITOR_PANEL_IDS,
  EDITOR_PANEL_LABELS,
  type EditorPanelId,
} from '../workspace/editor-panels';
import styles from '../editor-shell.module.css';

type EditorMenuId = 'edit' | 'file' | 'view';

interface EditorMenuBarProps {
  activePanel: EditorPanelId;
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  onError(message: string | null): void;
  onFileInput(event: ChangeEvent<HTMLInputElement>): void;
  onPanelChange(panel: EditorPanelId): void;
  snapshot: EditorSessionSnapshot;
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
  const [openMenu, setOpenMenu] = useState<EditorMenuId | null>(null);
  const rootReference = useRef<HTMLElement>(null);
  const fileReference = useRef<HTMLInputElement>(null);
  const loaded = snapshot.engine.duration > 0;
  const selected = snapshot.document.selection !== null;

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootReference.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  const toggle = (menu: EditorMenuId) => setOpenMenu((current) => (current === menu ? null : menu));
  const command = (action: () => void) => {
    setOpenMenu(null);
    action();
  };
  const exportAudio = async () => {
    setOpenMenu(null);
    onError(null);
    try {
      await controller.downloadWav();
    } catch (error) {
      onError(error instanceof Error ? error.message : copy('exportFailed'));
    }
  };

  return (
    <nav
      aria-label={copy('mainMenu')}
      className={styles.menuBar}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpenMenu(null);
      }}
      ref={rootReference}
      role="menubar"
    >
      <div className={styles.menuRoot} role="none">
        <button
          aria-expanded={openMenu === 'file'}
          aria-haspopup="menu"
          onClick={() => toggle('file')}
          role="menuitem"
          type="button"
        >
          {copy('fileMenu')}
        </button>
        {openMenu === 'file' ? (
          <div className={styles.menuPopup} role="menu">
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
          aria-expanded={openMenu === 'edit'}
          aria-haspopup="menu"
          onClick={() => toggle('edit')}
          role="menuitem"
          type="button"
        >
          {copy('editMenu')}
        </button>
        {openMenu === 'edit' ? (
          <div className={styles.menuPopup} role="menu">
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
          aria-expanded={openMenu === 'view'}
          aria-haspopup="menu"
          onClick={() => toggle('view')}
          role="menuitem"
          type="button"
        >
          {copy('viewMenu')}
        </button>
        {openMenu === 'view' ? (
          <div className={styles.menuPopup} role="menu">
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
    </nav>
  );
}
