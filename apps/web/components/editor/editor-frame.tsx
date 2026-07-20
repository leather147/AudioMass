'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createEditorCommand, EDITOR_RUNTIME_PATH, isEditorBridgeEvent } from '@/lib/editor-bridge';
import { isEditorPreferences, type EditorPreferences } from '@/lib/editor-preferences';

interface EditorFrameProps {
  initialPreferences: EditorPreferences;
}

export function EditorFrame({ initialPreferences }: EditorFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const preferencesRef = useRef(initialPreferences);
  const [ready, setReady] = useState(false);

  const persistPreferences = useCallback((preferences: EditorPreferences) => {
    void fetch('/api/editor-preferences', {
      body: JSON.stringify(preferences),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }).catch(() => undefined);
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
          persistPreferences(next);
        }
        return;
      }
      if (event.data.event === 'editor.ready') {
        setReady(true);
        sendPreferences();
      }
    };

    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [persistPreferences, sendPreferences]);

  return (
    <>
      <div aria-live="polite" className="editor-status" data-hidden={ready} role="status">
        Загрузка аудиоредактора…
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
