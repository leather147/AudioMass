'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { EditorPreferences } from '@/lib/editor-preferences';
import {
  createEditorCommand,
  isEditorBridgeEvent,
  LEGACY_EDITOR_PATH,
} from '@/lib/legacy-editor-bridge';

interface LegacyEditorProps {
  initialPreferences: EditorPreferences;
}

export function LegacyEditor({ initialPreferences }: LegacyEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  const sendPreferences = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      createEditorCommand('preferences.apply', initialPreferences),
      window.location.origin,
    );
  }, [initialPreferences]);

  useEffect(() => {
    const receiveMessage = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow
      ) {
        return;
      }
      if (!isEditorBridgeEvent(event.data)) return;
      if (event.data.event === 'editor.ready') {
        setReady(true);
        sendPreferences();
      }
    };

    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [sendPreferences]);

  return (
    <>
      <div aria-live="polite" className="editor-status" data-hidden={ready} role="status">
        Загрузка аудиоредактора…
      </div>
      <iframe
        allow="autoplay; clipboard-read; clipboard-write; microphone"
        className="editor-frame"
        onLoad={sendPreferences}
        ref={iframeRef}
        src={LEGACY_EDITOR_PATH}
        title="AudioMass editor"
      />
    </>
  );
}
