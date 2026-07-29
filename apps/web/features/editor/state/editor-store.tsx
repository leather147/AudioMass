'use client';

import type { EditorSessionSnapshot } from '@audiomass/audio-engine';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { EditorController } from '../application/editor-controller';

const EditorControllerContext = createContext<EditorController | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() => new EditorController());

  useEffect(() => {
    return () => {
      void controller.close();
    };
  }, [controller]);

  return (
    <EditorControllerContext.Provider value={controller}>
      {children}
    </EditorControllerContext.Provider>
  );
}

export function useEditorController(): EditorController {
  const controller = useContext(EditorControllerContext);
  if (!controller) throw new Error('useEditorController must be used inside EditorProvider.');
  return controller;
}

export function useEditorSnapshot(): EditorSessionSnapshot {
  const controller = useEditorController();
  return useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.snapshot,
    () => controller.snapshot,
  );
}
