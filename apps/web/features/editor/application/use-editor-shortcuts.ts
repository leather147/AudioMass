'use client';

import type { EditorSessionSnapshot } from '@audiomass/audio-engine';
import { useEffect } from 'react';

import type { EditorController } from './editor-controller';

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  );
}

export function useEditorShortcuts(controller: EditorController, snapshot: EditorSessionSnapshot) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const accelerator = event.ctrlKey || event.metaKey;

      if (accelerator && event.code === 'KeyA') {
        event.preventDefault();
        void controller.dispatch({ name: 'edit.select-all' });
        return;
      }
      if (accelerator && event.code === 'KeyC') {
        event.preventDefault();
        void controller.dispatch({ name: 'edit.copy' });
        return;
      }
      if (accelerator && event.code === 'KeyX') {
        event.preventDefault();
        void controller.dispatch({ name: 'edit.cut' });
        return;
      }
      if (accelerator && event.code === 'KeyV') {
        event.preventDefault();
        void controller.dispatch({ name: 'edit.paste' });
        return;
      }
      if (accelerator && event.code === 'KeyZ') {
        event.preventDefault();
        void controller.dispatch({ name: event.shiftKey ? 'history.redo' : 'history.undo' });
        return;
      }
      if (accelerator && event.code === 'KeyY') {
        event.preventDefault();
        void controller.dispatch({ name: 'history.redo' });
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        void controller.dispatch({
          name: snapshot.engine.state === 'playing' ? 'playback.pause' : 'playback.play',
        });
        return;
      }
      if (event.code === 'Delete' || event.code === 'Backspace') {
        if (snapshot.document.selection) {
          event.preventDefault();
          void controller.dispatch({ name: 'edit.delete' });
        }
        return;
      }
      if (event.code === 'Home') {
        event.preventDefault();
        void controller.dispatch({ name: 'playback.seek', seconds: 0 });
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [controller, snapshot.document.selection, snapshot.engine.state]);
}
