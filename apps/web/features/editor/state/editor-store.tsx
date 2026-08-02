'use client';

import type { EditorSessionSnapshot, MultitrackSessionSnapshot } from '@audiomass/audio-engine';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { EditorController } from '../application/editor-controller';
import { MultitrackController } from '../application/multitrack-controller';
import { EditorControllerLifetime } from './editor-controller-lifetime';

const EditorControllerContext = createContext<EditorController | null>(null);
const MultitrackControllerContext = createContext<MultitrackController | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [controller] = useState(() => new EditorController());
  const [multitrack] = useState(() => new MultitrackController());
  const [lifetime] = useState(() => new EditorControllerLifetime([controller, multitrack]));

  useEffect(() => {
    lifetime.mount();
    return () => lifetime.unmount();
  }, [lifetime]);

  return (
    <EditorControllerContext.Provider value={controller}>
      <MultitrackControllerContext.Provider value={multitrack}>
        {children}
      </MultitrackControllerContext.Provider>
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

export function useMultitrackController(): MultitrackController {
  const controller = useContext(MultitrackControllerContext);
  if (!controller) throw new Error('useMultitrackController must be used inside EditorProvider.');
  return controller;
}

export function useMultitrackSnapshot(): MultitrackSessionSnapshot {
  const controller = useMultitrackController();
  return useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.snapshot,
    () => controller.snapshot,
  );
}
