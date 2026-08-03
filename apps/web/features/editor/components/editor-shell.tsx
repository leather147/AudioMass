'use client';

import type { AudioEngineState } from '@audiomass/audio-engine';
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

import { editorCopy } from '@/lib/editor-copy';
import type { EditorPreferences } from '@/lib/editor-preferences';

import { useEditorShortcuts } from '../application/use-editor-shortcuts';
import { useAudioFileDrop } from '../infrastructure/use-audio-file-drop';
import { useOfflineCache } from '../infrastructure/use-offline-cache';
import {
  EditorProvider,
  useEditorController,
  useEditorSnapshot,
  useMultitrackController,
  useMultitrackSnapshot,
} from '../state/editor-store';
import { editorThemeStyle } from '../theme/editor-themes';
import { AnalysisPanel } from './analysis/analysis-panel';
import { ClassicEditorFooter } from './chrome/classic-editor-footer';
import { EffectToolbar } from './effects/effect-toolbar';
import { SpecializedEffectToolbar } from './effects/specialized-effect-toolbar';
import { EditorMenuBar } from './menus/editor-menu-bar';
import { MultitrackPanel } from './multitrack/multitrack-panel';
import { NotificationProvider } from './notifications/notification-provider';
import { TransportBar } from './transport/transport-bar';
import { WaveformWorkspace } from './waveform/waveform-workspace';
import { EDITOR_PANEL_LABELS, type EditorPanelId } from './workspace/editor-panels';

const ENGINE_STATE_LABELS: Record<AudioEngineState, Parameters<typeof editorCopy>[1]> = {
  closed: 'engineStateClosed',
  idle: 'engineStateIdle',
  paused: 'engineStatePaused',
  playing: 'engineStatePlaying',
  ready: 'engineStateReady',
};

function EditorWorkspace({
  initialPanel,
  preferences,
}: {
  initialPanel: EditorPanelId;
  preferences: EditorPreferences;
}) {
  const controller = useEditorController();
  const snapshot = useEditorSnapshot();
  const multitrackController = useMultitrackController();
  const multitrackSnapshot = useMultitrackSnapshot();
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanelId>(initialPanel);
  const [effectDialog, setEffectDialog] = useState<'standard' | 'specialized' | null>(null);
  const fileReference = useRef<HTMLInputElement>(null);
  const copy = useCallback(
    (key: Parameters<typeof editorCopy>[1]) => editorCopy(preferences.locale, key),
    [preferences.locale],
  );

  useEffect(() => controller.subscribeToErrors((value) => setError(value.message)), [controller]);

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await controller.openFile(file);
    } catch (value) {
      setError(value instanceof Error ? value.message : copy('openAudioFailed'));
    }
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    void openFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const drop = useAudioFileDrop(openFile);
  useEditorShortcuts(controller, snapshot);
  useOfflineCache();

  const selectPanel = useCallback((panel: EditorPanelId) => {
    setActivePanel(panel);
    const href = panel === 'waveform' ? '/editor' : `/editor?panel=${panel}`;
    window.history.replaceState(null, '', href);
  }, []);
  const openAudioPicker = useCallback(() => fileReference.current?.click(), []);

  return (
    <>
      <main
        className={`pk_app pk_single_wave_focus pk_react_app${activePanel === 'mixer' ? ' pk_mt_on' : ''}`}
        data-dragging={drop.active}
        data-theme={preferences.theme}
        lang={preferences.locale}
        style={editorThemeStyle(preferences.theme)}
        tabIndex={-1}
        {...drop.handlers}
      >
        <EditorMenuBar
          activePanel={activePanel}
          controller={controller}
          copy={copy}
          onError={setError}
          onOpenAudio={openAudioPicker}
          onOpenEffects={() => setEffectDialog('standard')}
          onOpenSpecializedEffects={() => setEffectDialog('specialized')}
          onPanelChange={selectPanel}
          snapshot={snapshot}
        />
        <input
          accept="audio/*"
          className="pk_react_visually_hidden"
          onChange={onFileInput}
          ref={fileReference}
          type="file"
        />
        <TransportBar
          controller={controller}
          copy={copy}
          documentName={
            activePanel === 'mixer' ? multitrackSnapshot.project.name : snapshot.document.name
          }
          mode={activePanel === 'mixer' ? 'multitrack' : 'waveform'}
          multitrackController={multitrackController}
          multitrackSnapshot={multitrackSnapshot}
          onWaveformView={() => selectPanel('waveform')}
          snapshot={snapshot}
        />

        {activePanel === 'waveform' ? (
          <WaveformWorkspace
            controller={controller}
            copy={copy}
            onOpenAudio={openAudioPicker}
            snapshot={snapshot}
          />
        ) : activePanel === 'mixer' ? (
          <>
            <MultitrackPanel copy={copy} onError={setError} />
            <ClassicEditorFooter copy={copy} onZoomIn={() => undefined} />
          </>
        ) : (
          <>
            <section className="pk_av_cont">
              <div className="pk_av" style={{ height: '100%' }}>
                <h1 className="pk_react_visually_hidden">
                  {copy(EDITOR_PANEL_LABELS[activePanel])}
                </h1>
                {activePanel === 'frequency' || activePanel === 'spectral' ? (
                  <AnalysisPanel
                    controller={controller}
                    copy={copy}
                    key={activePanel}
                    kind={activePanel}
                    snapshot={snapshot}
                  />
                ) : null}
              </div>
            </section>
            <div className="pk_ftr pk_noselect" />
          </>
        )}

        <div className="pk_react_visually_hidden" role="status">
          {copy('state')}: {copy(ENGINE_STATE_LABELS[snapshot.engine.state])}. {copy('sampleRate')}:{' '}
          {snapshot.engine.sampleRate ?? '—'}
        </div>
        {error ? <p className="pk_react_error">{error}</p> : null}
      </main>

      <EffectToolbar
        controller={controller}
        copy={copy}
        onError={setError}
        onOpenChange={(open) => setEffectDialog(open ? 'standard' : null)}
        open={effectDialog === 'standard'}
        selected={snapshot.document.selection !== null}
        showTrigger={false}
      />
      <SpecializedEffectToolbar
        controller={controller}
        copy={copy}
        onError={setError}
        onOpenChange={(open) => setEffectDialog(open ? 'specialized' : null)}
        open={effectDialog === 'specialized'}
        selected={snapshot.document.selection !== null}
        selectionDuration={
          snapshot.document.selection
            ? snapshot.document.selection.end - snapshot.document.selection.start
            : 0
        }
        showTrigger={false}
      />
    </>
  );
}

export function EditorShell({
  initialPanel = 'waveform',
  preferences,
}: {
  initialPanel?: EditorPanelId;
  preferences: EditorPreferences;
}) {
  return (
    <EditorProvider>
      <NotificationProvider dismissLabel={editorCopy(preferences.locale, 'dismiss')}>
        <EditorWorkspace initialPanel={initialPanel} preferences={preferences} />
      </NotificationProvider>
    </EditorProvider>
  );
}
