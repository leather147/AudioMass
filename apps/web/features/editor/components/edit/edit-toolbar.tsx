'use client';

import type { EditorSessionSnapshot, WavBitDepth } from '@audiomass/audio-engine';
import { type FormEvent, useState } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import styles from '../editor-shell.module.css';

interface EditToolbarProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  onError(message: string | null): void;
  snapshot: EditorSessionSnapshot;
}

export function EditToolbar({ controller, copy, onError, snapshot }: EditToolbarProps) {
  const [bitDepth, setBitDepth] = useState<WavBitDepth>(16);
  const [silenceDuration, setSilenceDuration] = useState(1);
  const loaded = snapshot.engine.duration > 0;
  const selected = snapshot.document.selection !== null;

  const applySelection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void controller.dispatch({
      name: 'selection.set',
      range: {
        end: Number(values.get('selectionEnd')),
        start: Number(values.get('selectionStart')),
      },
    });
  };

  const download = async () => {
    onError(null);
    try {
      await controller.downloadWav(bitDepth);
    } catch (error) {
      onError(error instanceof Error ? error.message : copy('exportFailed'));
    }
  };

  return (
    <section aria-label={copy('editing')} className={styles.editToolbar}>
      <form
        className={styles.selectionForm}
        key={`${snapshot.document.selection?.start ?? 0}:${snapshot.document.selection?.end ?? snapshot.engine.duration}`}
        onSubmit={applySelection}
      >
        <label>
          {copy('selectionStart')}
          <input
            disabled={!loaded}
            max={snapshot.engine.duration}
            min={0}
            defaultValue={snapshot.document.selection?.start ?? 0}
            name="selectionStart"
            step="0.001"
            type="number"
          />
        </label>
        <label>
          {copy('selectionEnd')}
          <input
            disabled={!loaded}
            max={snapshot.engine.duration}
            min={0}
            defaultValue={snapshot.document.selection?.end ?? snapshot.engine.duration}
            name="selectionEnd"
            step="0.001"
            type="number"
          />
        </label>
        <button disabled={!loaded} type="submit">
          {copy('setSelection')}
        </button>
      </form>

      <div className={styles.editActions}>
        <button
          disabled={!loaded}
          onClick={() => void controller.dispatch({ name: 'edit.select-all' })}
          type="button"
        >
          {copy('selectAll')}
        </button>
        <button
          disabled={!selected}
          onClick={() => void controller.dispatch({ name: 'edit.copy' })}
          type="button"
        >
          {copy('copy')}
        </button>
        <button
          disabled={!selected}
          onClick={() => void controller.dispatch({ name: 'edit.cut' })}
          type="button"
        >
          {copy('cut')}
        </button>
        <button
          disabled={!snapshot.clipboardFrames}
          onClick={() => void controller.dispatch({ name: 'edit.paste' })}
          type="button"
        >
          {copy('paste')}
        </button>
        <button
          disabled={!selected}
          onClick={() => void controller.dispatch({ name: 'edit.delete' })}
          type="button"
        >
          {copy('deleteSelection')}
        </button>
        <button
          disabled={!selected}
          onClick={() => void controller.dispatch({ name: 'edit.trim' })}
          type="button"
        >
          {copy('trimSelection')}
        </button>
        <label>
          {copy('silenceDuration')}
          <input
            disabled={!loaded}
            max={3600}
            min={0.001}
            onChange={(event) => setSilenceDuration(Number(event.target.value))}
            step="0.1"
            type="number"
            value={silenceDuration}
          />
        </label>
        <button
          disabled={!loaded}
          onClick={() =>
            void controller.dispatch({ duration: silenceDuration, name: 'edit.insert-silence' })
          }
          type="button"
        >
          {copy('insertSilence')}
        </button>
        <label>
          {copy('wavBitDepth')}
          <select
            disabled={!loaded}
            onChange={(event) => setBitDepth(Number(event.target.value) as WavBitDepth)}
            value={bitDepth}
          >
            <option value={16}>16-bit PCM</option>
            <option value={24}>24-bit PCM</option>
            <option value={32}>32-bit float</option>
          </select>
        </label>
        <button disabled={!loaded} onClick={() => void download()} type="button">
          {copy('exportWav')}
        </button>
      </div>
    </section>
  );
}
