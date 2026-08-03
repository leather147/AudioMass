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
import { ClassicEditorFooter } from '../chrome/classic-editor-footer';
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
  onOpenAudio(): void;
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

export function WaveformWorkspace({
  controller,
  copy,
  onOpenAudio,
  snapshot,
}: WaveformWorkspaceProps) {
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
          error: error instanceof Error ? error.message : copy('waveformFailed'),
          key: analysisKey,
        });
      },
    );
    return () => {
      if (requestSequence.current === requestId) requestSequence.current += 1;
    };
  }, [analysisKey, analysisWidth, controller, copy, duration, startTransition, width]);

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
  const channels = analysis?.channels ?? [null, null];

  return (
    <>
      <div className="pk_av_cont">
        <div aria-label={copy('waveform')} className="pk_av pk_noselect" id="pk_av_react">
          <div className="pk_react_ruler">
            {ticks.map((tick) => (
              <i
                aria-hidden="true"
                className={tick.major ? 'pk_react_major' : undefined}
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
            className="pk_react_wave"
            onKeyDown={onKeyDown}
            onPointerCancel={cancelSelection}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishSelection}
            ref={reference}
            role="slider"
            tabIndex={0}
          >
            {channels.map((channel, index) => (
              <div className="pk_react_wave_channel" key={index}>
                <WaveformCanvas
                  height={420}
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
                className="pk_react_selection"
                style={{
                  left: `${Math.max(0, selectionStart)}%`,
                  width: `${Math.max(0, Math.min(100, selectionEnd) - Math.max(0, selectionStart))}%`,
                }}
              />
            ) : null}
            {visibleMarkers.map((marker) => (
              <button
                aria-label={`${marker.name}: ${formatEditorTime(marker.time)}`}
                className="pk_react_marker"
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
            {duration > 0 && playhead >= 0 && playhead <= 100 ? (
              <i
                aria-hidden="true"
                className="pk_react_playhead"
                style={{ left: `${playhead}%` }}
              />
            ) : null}
          </div>
          {!analysis ? (
            <div className="pk_tmpMsg pk_ed_empty">
              {copy('dropAudio')}{' '}
              <a
                href="#open-audio"
                onClick={(event) => {
                  event.preventDefault();
                  onOpenAudio();
                }}
                style={{
                  border: '1px solid',
                  borderRadius: 23,
                  fontSize: '.94em',
                  marginLeft: 5,
                  padding: '5px 18px',
                  whiteSpace: 'nowrap',
                }}
              >
                {copy('useSample')}
              </a>
            </div>
          ) : null}
          {analysisError || loading ? (
            <p aria-live="polite" className="pk_react_error">
              {analysisError ?? copy('loadingWaveform')}
            </p>
          ) : null}
        </div>

        <div className="pk_panner pk_noselect">
          <div className="pk_pan_left">
            <button className="pk_pan_btn" tabIndex={-1} type="button">
              <strong>L</strong> {copy('enabled')}
            </button>
          </div>
          <div className="pk_pan_right">
            <button className="pk_pan_btn" tabIndex={-1} type="button">
              <strong>R</strong> {copy('enabled')}
            </button>
          </div>
        </div>
      </div>

      <ClassicEditorFooter
        copy={copy}
        onResetZoom={() => {
          setZoom(1);
          setScroll(0);
        }}
        onZoomIn={() => setZoom((current) => clampTimelineZoom(current + 1))}
        onZoomOut={() => setZoom((current) => clampTimelineZoom(current - 1))}
        playheadPercent={playhead}
        scrollPercent={scroll * (100 - 100 / zoom)}
        viewportPercent={100 / zoom}
        zoom={zoom}
      />
    </>
  );
}
