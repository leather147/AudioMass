import type { ChangeEvent } from 'react';
import type { EditorSessionSnapshot } from '@audiomass/audio-engine';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import styles from '../editor-shell.module.css';

interface TransportBarProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  documentName: string;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  snapshot: EditorSessionSnapshot;
}

export function TransportBar({
  controller,
  copy,
  documentName,
  onFileInput,
  snapshot,
}: TransportBarProps) {
  const loaded = snapshot.engine.duration > 0;
  return (
    <header aria-label={copy('transport')} className={styles.toolbar}>
      <label className={styles.fileButton}>
        {copy('openAudio')}
        <input accept="audio/*" onChange={onFileInput} type="file" />
      </label>
      <button
        disabled={!loaded}
        onClick={() => void controller.dispatch({ name: 'playback.play' })}
        type="button"
      >
        {copy('play')}
      </button>
      <button
        disabled={!loaded}
        onClick={() => void controller.dispatch({ name: 'playback.pause' })}
        type="button"
      >
        {copy('pause')}
      </button>
      <button
        disabled={!snapshot.canUndo}
        onClick={() => void controller.dispatch({ name: 'history.undo' })}
        type="button"
      >
        {copy('undo')}
      </button>
      <button
        disabled={!snapshot.canRedo}
        onClick={() => void controller.dispatch({ name: 'history.redo' })}
        type="button"
      >
        {copy('redo')}
      </button>
      <strong>{documentName}</strong>
    </header>
  );
}
