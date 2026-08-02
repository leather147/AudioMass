'use client';

import { type ChangeEvent, useEffect, useState } from 'react';

import { editorCopy } from '@/lib/editor-copy';
import type { EditorPreferences } from '@/lib/editor-preferences';

import { useEditorShortcuts } from '../application/use-editor-shortcuts';
import { useAudioFileDrop } from '../infrastructure/use-audio-file-drop';
import { EditorProvider, useEditorController, useEditorSnapshot } from '../state/editor-store';
import { editorThemeStyle } from '../theme/editor-themes';
import { EditToolbar } from './edit/edit-toolbar';
import { EffectToolbar } from './effects/effect-toolbar';
import { SpecializedEffectToolbar } from './effects/specialized-effect-toolbar';
import { MarkerPanel } from './markers/marker-panel';
import { MultitrackPanel } from './multitrack/multitrack-panel';
import { NotificationProvider } from './notifications/notification-provider';
import { TransportBar } from './transport/transport-bar';
import { WaveformWorkspace } from './waveform/waveform-workspace';
import styles from './editor-shell.module.css';

function EditorWorkspace({ preferences }: { preferences: EditorPreferences }) {
  const controller = useEditorController();
  const snapshot = useEditorSnapshot();
  const [error, setError] = useState<string | null>(null);
  const [markerName, setMarkerName] = useState('');
  const copy = (key: Parameters<typeof editorCopy>[1]) => editorCopy(preferences.locale, key);

  useEffect(() => controller.subscribeToErrors((value) => setError(value.message)), [controller]);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await controller.openFile(file);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Could not open the audio file.');
    }
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    void openFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const drop = useAudioFileDrop(openFile);
  useEditorShortcuts(controller, snapshot);

  return (
    <main
      className={styles.shell}
      lang={preferences.locale}
      style={editorThemeStyle(preferences.theme)}
    >
      <TransportBar
        controller={controller}
        copy={copy}
        documentName={snapshot.document.name}
        onFileInput={onFileInput}
        snapshot={snapshot}
      />
      <EditToolbar controller={controller} copy={copy} onError={setError} snapshot={snapshot} />
      <EffectToolbar
        controller={controller}
        copy={copy}
        onError={setError}
        selected={snapshot.document.selection !== null}
      />
      <SpecializedEffectToolbar
        controller={controller}
        copy={copy}
        onError={setError}
        selected={snapshot.document.selection !== null}
        selectionDuration={
          snapshot.document.selection
            ? snapshot.document.selection.end - snapshot.document.selection.start
            : 0
        }
      />
      <MultitrackPanel copy={copy} onError={setError} />

      <section className={styles.workspace}>
        <section
          className={styles.dropzone}
          data-dragging={drop.active}
          tabIndex={0}
          {...drop.handlers}
        >
          <h1>{copy('nativeEditorTitle')}</h1>
          <p>{copy('dropAudio')}</p>
          <WaveformWorkspace controller={controller} copy={copy} snapshot={snapshot} />
          {error ? <p className={styles.error}>{error}</p> : null}
        </section>

        <MarkerPanel
          controller={controller}
          copy={copy}
          markerName={markerName}
          onMarkerNameChange={setMarkerName}
          snapshot={snapshot}
        />
      </section>

      <footer className={styles.statusbar}>
        <span>
          {copy('state')}: {snapshot.engine.state}
        </span>
        <span>
          {copy('sampleRate')}: {snapshot.engine.sampleRate ?? '—'}
        </span>
      </footer>
    </main>
  );
}

export function EditorShell({ preferences }: { preferences: EditorPreferences }) {
  return (
    <EditorProvider>
      <NotificationProvider>
        <EditorWorkspace preferences={preferences} />
      </NotificationProvider>
    </EditorProvider>
  );
}
