import type { FormEvent } from 'react';

import type { EditorSessionSnapshot } from '@audiomass/audio-engine';
import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import { formatEditorTime } from '../waveform/timeline-math';
import styles from '../editor-shell.module.css';

interface MarkerPanelProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  markerName: string;
  onMarkerNameChange: (name: string) => void;
  snapshot: EditorSessionSnapshot;
}

export function MarkerPanel({
  controller,
  copy,
  markerName,
  onMarkerNameChange,
  snapshot,
}: MarkerPanelProps) {
  const loaded = snapshot.engine.duration > 0;
  const addMarker = (event: FormEvent) => {
    event.preventDefault();
    void controller.dispatch({
      marker: { name: markerName, time: snapshot.engine.position },
      name: 'marker.add',
    });
    onMarkerNameChange('');
  };

  return (
    <aside className={styles.sidebar}>
      <h2>{copy('markers')}</h2>
      <form className={styles.markerForm} onSubmit={addMarker}>
        <input
          aria-label={copy('markerName')}
          disabled={!loaded}
          maxLength={60}
          onChange={(event) => onMarkerNameChange(event.target.value)}
          placeholder={copy('markerName')}
          value={markerName}
        />
        <button disabled={!loaded} type="submit">
          {copy('addAtCursor')}
        </button>
      </form>
      <ol className={styles.markers}>
        {snapshot.document.markers.map((marker) => (
          <li className={styles.marker} key={marker.id}>
            <span className={styles.markerColor} style={{ backgroundColor: marker.color }} />
            <button
              onClick={() =>
                void controller.dispatch({ name: 'playback.seek', seconds: marker.time })
              }
              type="button"
            >
              {marker.name} · {formatEditorTime(marker.time)}
            </button>
            <button
              aria-label={`${copy('removeMarker')}: ${marker.name}`}
              onClick={() => void controller.dispatch({ id: marker.id, name: 'marker.remove' })}
              type="button"
            >
              ×
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
