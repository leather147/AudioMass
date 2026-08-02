'use client';

import type { MultitrackSessionSnapshot } from '@audiomass/audio-engine';

import type { EditorCopyKey } from '@/lib/editor-copy';

import {
  formatEditorTime,
  createTimelineTicks,
  createTimelineViewport,
} from '../waveform/timeline-math';
import { useElementWidth } from '../waveform/use-element-width';
import styles from '../editor-shell.module.css';

interface MultitrackTimelineProps {
  copy: (key: EditorCopyKey) => string;
  onSeek: (seconds: number) => void;
  snapshot: MultitrackSessionSnapshot;
}

export function MultitrackTimeline({ copy, onSeek, snapshot }: MultitrackTimelineProps) {
  const { reference, width } = useElementWidth<HTMLDivElement>();
  const duration = snapshot.transport.duration;
  const viewport = createTimelineViewport(duration, 1, 0);
  const ticks = createTimelineTicks(viewport, Math.max(0, width - 128));
  const crossfadeClips = new Set(
    snapshot.crossfades.flatMap((crossfade) => [crossfade.firstClipId, crossfade.secondClipId]),
  );
  const percent = (seconds: number) => `${(seconds / Math.max(duration, 0.001)) * 100}%`;
  const clipPercent = (seconds: number, clipDuration: number) =>
    `${(seconds / Math.max(clipDuration, 0.001)) * 100}%`;

  return (
    <section aria-label={copy('trackTimeline')} className={styles.trackTimeline}>
      <div className={styles.trackTimelineViewport} ref={reference}>
        <div className={styles.trackRuler}>
          {ticks.map((tick) => (
            <i key={tick.time} style={{ left: `${tick.percent}%` }}>
              <span>{tick.label}</span>
            </i>
          ))}
        </div>
        <div className={styles.trackLanes}>
          {snapshot.project.tracks.map((track) => (
            <div className={styles.trackLane} key={track.id}>
              <strong title={track.name}>{track.name}</strong>
              <div className={styles.trackLaneContent}>
                {track.clips.map((clip) => (
                  <div
                    className={styles.trackClip}
                    data-crossfade={crossfadeClips.has(clip.id)}
                    key={clip.id}
                    style={{
                      backgroundColor: track.color,
                      left: percent(clip.start),
                      width: percent(clip.duration),
                    }}
                    title={`${clip.name} · ${formatEditorTime(clip.start)}–${formatEditorTime(clip.start + clip.duration)}`}
                  >
                    <span>{clip.name}</span>
                    {clip.fadeIn > 0 ? (
                      <i
                        className={styles.clipFadeIn}
                        style={{ width: clipPercent(clip.fadeIn, clip.duration) }}
                      />
                    ) : null}
                    {clip.fadeOut > 0 ? (
                      <i
                        className={styles.clipFadeOut}
                        style={{ width: clipPercent(clip.fadeOut, clip.duration) }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {duration > 0 ? (
            <div aria-hidden="true" className={styles.trackPlayheadGrid}>
              <i
                className={styles.trackPlayhead}
                style={{ left: percent(snapshot.transport.position) }}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.multitrackTimeline}>
        <input
          aria-label={copy('playbackPosition')}
          disabled={duration <= 0}
          max={duration || 1}
          min={0}
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
          step="0.001"
          type="range"
          value={snapshot.transport.position}
        />
        <output>
          {formatEditorTime(snapshot.transport.position)} / {formatEditorTime(duration)}
        </output>
      </div>
    </section>
  );
}
