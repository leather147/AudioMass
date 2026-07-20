'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createEditorCommand, EDITOR_RUNTIME_PATH, isEditorBridgeEvent } from '@/lib/editor-bridge';
import { editorCopy } from '@/lib/editor-copy';
import { isEditorPreferences, type EditorPreferences } from '@/lib/editor-preferences';
import { createSerialTaskQueue } from '@/lib/serial-task-queue';

interface EditorFrameProps {
  initialPreferences: EditorPreferences;
}

async function postEditorPreferences(preferences: EditorPreferences) {
  const response = await fetch('/api/editor-preferences', {
    body: JSON.stringify(preferences),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Could not persist editor preferences (${response.status})`);
  }
}

export function EditorFrame({ initialPreferences }: EditorFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const preferencesRef = useRef(initialPreferences);
  const persistenceQueueRef = useRef(createSerialTaskQueue(postEditorPreferences));
  const [ready, setReady] = useState(false);

  const applyShellLocale = useCallback((locale: EditorPreferences['locale']) => {
    document.documentElement.lang = locale;
    document.title = `${editorCopy(locale, 'editorTitle')} · AudioMass`;
  }, []);

  const persistPreferences = useCallback((preferences: EditorPreferences) => {
    void persistenceQueueRef.current.enqueue({ ...preferences }).catch(() => undefined);
  }, []);

  const sendPreferences = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      createEditorCommand('preferences.apply', preferencesRef.current),
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    const receiveMessage = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow
      ) {
        return;
      }
      if (!isEditorBridgeEvent(event.data)) return;
      if (event.data.event === 'preferences.changed' && isEditorPreferences(event.data.payload)) {
        const next = event.data.payload;
        const current = preferencesRef.current;
        if (next.locale !== current.locale || next.theme !== current.theme) {
          preferencesRef.current = next;
          applyShellLocale(next.locale);
          persistPreferences(next);
        }
        return;
      }
      if (event.data.event === 'editor.ready') {
        setReady(true);
        sendPreferences();
      }
    };

    applyShellLocale(initialPreferences.locale);
    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [applyShellLocale, initialPreferences.locale, persistPreferences, sendPreferences]);

  return (
    <>
      <div aria-live="polite" className="editor-status" data-hidden={ready} role="status">
        {editorCopy(initialPreferences.locale, 'loadingEditor')}
      </div>
      <iframe
        allow="autoplay; clipboard-read; clipboard-write; microphone"
        className="editor-frame"
        ref={iframeRef}
        src={EDITOR_RUNTIME_PATH}
        title="AudioMass editor"
      />
    </>
  );
}
