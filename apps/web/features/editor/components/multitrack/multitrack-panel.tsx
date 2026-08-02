'use client';

import type { ChangeEvent } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import { useMultitrackController, useMultitrackSnapshot } from '../../state/editor-store';
import styles from '../editor-shell.module.css';
import { MultitrackTimeline } from './multitrack-timeline';

interface MultitrackPanelProps {
  copy: (key: EditorCopyKey) => string;
  onError: (error: string | null) => void;
}

export function MultitrackPanel({ copy, onError }: MultitrackPanelProps) {
  const controller = useMultitrackController();
  const snapshot = useMultitrackSnapshot();
  const loaded = snapshot.transport.duration > 0;

  const run = async (action: () => Promise<void>) => {
    onError(null);
    try {
      await action();
    } catch (error) {
      onError(error instanceof Error ? error.message : copy('multitrackFailed'));
    }
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (files.length > 0) void run(() => controller.addFiles(files));
  };

  return (
    <section aria-label={copy('multitrackMixer')} className={styles.multitrackPanel}>
      <header className={styles.multitrackHeader}>
        <strong>{copy('multitrackMixer')}</strong>
        <label className={styles.fileButton}>
          {copy('addTracks')}
          <input accept="audio/*" multiple onChange={addFiles} type="file" />
        </label>
        <button disabled={!loaded} onClick={() => void run(() => controller.play())} type="button">
          {copy('play')}
        </button>
        <button disabled={!loaded} onClick={() => controller.pause()} type="button">
          {copy('pause')}
        </button>
        <button disabled={!loaded} onClick={() => controller.stop()} type="button">
          {copy('stop')}
        </button>
        <button
          disabled={!loaded}
          onClick={() => void run(() => controller.downloadWav())}
          type="button"
        >
          {copy('exportMix')}
        </button>
        <button
          disabled={!loaded}
          onClick={() => void run(() => controller.saveProject())}
          type="button"
        >
          {copy('save')}
        </button>
        <button onClick={() => void run(() => controller.restoreProject())} type="button">
          {copy('restoreProject')}
        </button>
        <label>
          {copy('master')}
          <input
            aria-label={copy('master')}
            max={1}
            min={0}
            onChange={(event) => controller.updateMasterGain(Number(event.currentTarget.value))}
            step={0.01}
            type="range"
            value={snapshot.mixer.masterGain}
          />
        </label>
      </header>

      <MultitrackTimeline
        copy={copy}
        onSeek={(seconds) => void run(() => controller.seek(seconds))}
        snapshot={snapshot}
      />

      {snapshot.project.tracks.length === 0 ? (
        <p className={styles.multitrackEmpty}>{copy('multitrackEmpty')}</p>
      ) : (
        <div className={styles.multitrackMixer}>
          {snapshot.project.tracks.map((track) => (
            <article className={styles.multitrackChannel} key={track.id}>
              <header>
                <i style={{ background: track.color }} />
                <strong title={track.name}>{track.name}</strong>
                <button
                  aria-label={`${copy('removeTrack')}: ${track.name}`}
                  onClick={() => controller.removeTrack(track.id)}
                  type="button"
                >
                  ×
                </button>
              </header>
              <div className={styles.multitrackToggles}>
                <button
                  aria-pressed={track.muted}
                  onClick={() => controller.updateTrack(track.id, { muted: !track.muted })}
                  type="button"
                >
                  {copy('mute')}
                </button>
                <button
                  aria-pressed={track.solo}
                  onClick={() => controller.updateTrack(track.id, { solo: !track.solo })}
                  type="button"
                >
                  {copy('solo')}
                </button>
              </div>
              <label>
                {copy('pan')}
                <input
                  max={1}
                  min={-1}
                  onChange={(event) =>
                    controller.updateTrack(track.id, { pan: Number(event.currentTarget.value) })
                  }
                  step={0.01}
                  type="range"
                  value={track.pan}
                />
              </label>
              <label>
                {copy('volume')}
                <input
                  max={1}
                  min={0}
                  onChange={(event) =>
                    controller.updateTrack(track.id, { gain: Number(event.currentTarget.value) })
                  }
                  step={0.01}
                  type="range"
                  value={track.gain}
                />
              </label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
