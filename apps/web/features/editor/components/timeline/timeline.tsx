import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import styles from '../editor-shell.module.css';

export function formatEditorTime(seconds: number): string {
  const milliseconds = Math.round(Math.max(0, seconds) * 1000);
  const minutes = Math.floor(milliseconds / 60_000);
  const remainder = milliseconds % 60_000;
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(remainder / 1000)).padStart(2, '0')}.${String(remainder % 1000).padStart(3, '0')}`;
}

interface TimelineProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  duration: number;
  position: number;
}

export function Timeline({ controller, copy, duration, position }: TimelineProps) {
  return (
    <section aria-label={copy('timeline')} className={styles.timelinePanel}>
      <input
        aria-label={copy('playbackPosition')}
        className={styles.timeline}
        disabled={duration <= 0}
        max={duration || 1}
        min={0}
        onChange={(event) =>
          void controller.dispatch({
            name: 'playback.seek',
            seconds: Number(event.target.value),
          })
        }
        step="0.001"
        type="range"
        value={position}
      />
      <output>
        {formatEditorTime(position)} / {formatEditorTime(duration)}
      </output>
    </section>
  );
}
