'use client';

import type { AudioEngineState } from '@audiomass/audio-engine';
import { useEffect } from 'react';

import type { EditorController } from './editor-controller';

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  );
}

export function useEditorShortcuts(controller: EditorController, state: AudioEngineState) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const accelerator = event.ctrlKey || event.metaKey;

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
          name: state === 'playing' ? 'playback.pause' : 'playback.play',
        });
        return;
      }
      if (event.code === 'Home') {
        event.preventDefault();
        void controller.dispatch({ name: 'playback.seek', seconds: 0 });
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [controller, state]);
}
