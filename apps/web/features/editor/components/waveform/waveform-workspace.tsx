'use client';

import type { EditorSessionSnapshot, WaveformAnalysis } from '@audiomass/audio-engine';
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import styles from '../editor-shell.module.css';
import {
  clampTimelineZoom,
  createTimelineTicks,
  createTimelineViewport,
  formatEditorTime,
  timelinePercent,
  timelineTimeAtPixel,
} from './timeline-math';
import { useElementWidth } from './use-element-width';
import { WaveformCanvas } from './waveform-canvas';

interface WaveformWorkspaceProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  snapshot: EditorSessionSnapshot;
}

interface DraftSelection {
  end: number;
  start: number;
}

interface WaveformAnalysisState {
  analysis: WaveformAnalysis | null;
  error: string | null;
  key: string | null;
}

export function WaveformWorkspace({ controller, copy, snapshot }: WaveformWorkspaceProps) {
  const { reference, width } = useElementWidth<HTMLDivElement>();
  const [analysisState, setAnalysisState] = useState<WaveformAnalysisState>({
    analysis: null,
    error: null,
    key: null,
  });
  const [zoom, setZoom] = useState(1);
  const [scroll, setScroll] = useState(0);
  const [draftSelection, setDraftSelection] = useState<DraftSelection | null>(null);
  const [, startTransition] = useTransition();
  const requestSequence = useRef(0);
  const selectionAnchor = useRef<number | null>(null);
  const duration = snapshot.engine.duration;
  const viewport = useMemo(
    () => createTimelineViewport(duration, zoom, scroll),
    [duration, scroll, zoom],
  );
  const ticks = useMemo(() => createTimelineTicks(viewport, width), [viewport, width]);
  const analysisWidth = Math.max(1, Math.min(16_384, Math.ceil(width * viewport.zoom)));
  const analysisKey = `${snapshot.audioRevision}:${analysisWidth}`;
  const analysis = analysisState.key === analysisKey ? analysisState.analysis : null;
  const analysisError = analysisState.key === analysisKey ? analysisState.error : null;
  const loading = duration > 0 && width > 0 && analysisState.key !== analysisKey;

  useEffect(() => {
    const requestId = ++requestSequence.current;
    if (duration <= 0 || width <= 0) return;
    void controller.extractWaveform(analysisWidth).then(
      (result) => {
        if (requestSequence.current !== requestId) return;
        startTransition(() =>
          setAnalysisState({ analysis: result, error: null, key: analysisKey }),
        );
      },
      (error: unknown) => {
        if (requestSequence.current !== requestId) return;
        setAnalysisState({
          analysis: null,
          error: error instanceof Error ? error.message : 'Waveform analysis failed.',
          key: analysisKey,
        });
      },
    );
    return () => {
      if (requestSequence.current === requestId) requestSequence.current += 1;
    };
  }, [analysisKey, analysisWidth, controller, duration, startTransition, width]);

  const pointerTime = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return timelineTimeAtPixel(event.clientX - bounds.left, bounds.width, viewport);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (duration <= 0 || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const time = pointerTime(event);
    selectionAnchor.current = time;
    setDraftSelection({ end: time, start: time });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const anchor = selectionAnchor.current;
    if (anchor === null) return;
    const time = pointerTime(event);
    setDraftSelection({ end: Math.max(anchor, time), start: Math.min(anchor, time) });
  };

  const finishSelection = (event: PointerEvent<HTMLDivElement>) => {
    const anchor = selectionAnchor.current;
    if (anchor === null) return;
    const time = pointerTime(event);
    selectionAnchor.current = null;
    setDraftSelection(null);
    if (Math.abs(time - anchor) < Math.max(0.002, (viewport.duration / Math.max(width, 1)) * 3)) {
      void controller.dispatch({ name: 'playback.seek', seconds: time });
      return;
    }
    void controller.dispatch({
      name: 'selection.set',
      range: { end: Math.max(anchor, time), start: Math.min(anchor, time) },
    });
  };

  const cancelSelection = () => {
    selectionAnchor.current = null;
    setDraftSelection(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (duration <= 0 || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    void controller.dispatch({
      name: 'playback.seek',
      seconds: Math.max(
        0,
        Math.min(duration, snapshot.engine.position + (direction * viewport.duration) / 100),
      ),
    });
  };

  const selected = draftSelection ?? snapshot.document.selection;
  const selectionStart = selected ? timelinePercent(selected.start, viewport) : 0;
  const selectionEnd = selected ? timelinePercent(selected.end, viewport) : 0;
  const playhead = timelinePercent(snapshot.engine.position, viewport);
  const visibleMarkers = snapshot.document.markers.filter(
    (marker) => marker.time >= viewport.start && marker.time <= viewport.end,
  );

  return (
    <section aria-label={copy('waveform')} className={styles.waveformPanel}>
      <header className={styles.waveformControls}>
        <strong>{copy('waveform')}</strong>
        <label>
          {copy('zoom')}
          <input
            aria-label={copy('zoom')}
            max={32}
            min={1}
            onChange={(event) => setZoom(clampTimelineZoom(Number(event.currentTarget.value)))}
            step={1}
            type="range"
            value={zoom}
          />
          <output>{zoom}×</output>
        </label>
        <label>
          {copy('scroll')}
          <input
            aria-label={copy('scroll')}
            disabled={zoom === 1}
            max={1}
            min={0}
            onChange={(event) => setScroll(Number(event.currentTarget.value))}
            step={0.001}
            type="range"
            value={scroll}
          />
        </label>
        <output>
          {formatEditorTime(snapshot.engine.position)} / {formatEditorTime(duration)}
        </output>
      </header>

      <div className={styles.waveformOverview}>
        <WaveformCanvas
          height={44}
          peaks={analysis?.overview ?? null}
          totalDuration={duration}
          viewport={createTimelineViewport(duration, 1, 0)}
          width={width}
        />
        <i
          aria-hidden="true"
          className={styles.waveformViewport}
          style={{ left: `${scroll * (100 - 100 / zoom)}%`, width: `${100 / zoom}%` }}
        />
      </div>

      <div className={styles.waveformRuler}>
        {ticks.map((tick) => (
          <i
            aria-hidden="true"
            className={tick.major ? styles.rulerMajorTick : styles.rulerTick}
            key={tick.time}
            style={{ left: `${tick.percent}%` }}
          >
            <span>{tick.label}</span>
          </i>
        ))}
      </div>

      <div
        aria-label={copy('waveformInteraction')}
        aria-valuemax={duration}
        aria-valuemin={0}
        aria-valuenow={snapshot.engine.position}
        className={styles.waveformInteraction}
        onKeyDown={onKeyDown}
        onPointerCancel={cancelSelection}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishSelection}
        ref={reference}
        role="slider"
        tabIndex={0}
      >
        {analysis?.channels.map((channel, index) => (
          <div className={styles.waveformChannel} key={index}>
            <span className={styles.waveformChannelLabel}>
              {copy('channel')} {index + 1}
            </span>
            <WaveformCanvas
              height={112}
              peaks={channel}
              totalDuration={duration}
              viewport={viewport}
              width={width}
            />
          </div>
        ))}
        {selected && selectionEnd >= 0 && selectionStart <= 100 ? (
          <i
            aria-hidden="true"
            className={styles.waveformSelection}
            style={{
              left: `${Math.max(0, selectionStart)}%`,
              width: `${Math.max(0, Math.min(100, selectionEnd) - Math.max(0, selectionStart))}%`,
            }}
          />
        ) : null}
        {visibleMarkers.map((marker) => (
          <button
            aria-label={`${marker.name}: ${formatEditorTime(marker.time)}`}
            className={styles.waveformMarker}
            key={marker.id}
            onClick={(event) => {
              event.stopPropagation();
              void controller.dispatch({ name: 'playback.seek', seconds: marker.time });
            }}
            onPointerDown={(event) => event.stopPropagation()}
            style={
              {
                left: `${timelinePercent(marker.time, viewport)}%`,
                '--marker-color': marker.color,
              } as CSSProperties
            }
            title={marker.name}
            type="button"
          />
        ))}
        {playhead >= 0 && playhead <= 100 ? (
          <i
            aria-hidden="true"
            className={styles.waveformPlayhead}
            style={{ left: `${playhead}%` }}
          />
        ) : null}
      </div>

      <p aria-live="polite" className={analysisError ? styles.error : styles.waveformStatus}>
        {analysisError ??
          (loading ? copy('loadingWaveform') : analysis ? '' : copy('waveformEmpty'))}
      </p>
    </section>
  );
}
