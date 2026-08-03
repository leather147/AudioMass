'use client';

import type { AudioTrack, MixerTrackUpdate } from '@audiomass/audio-engine';
import { type ChangeEvent, type CSSProperties, type PointerEvent, useMemo, useRef } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import { useMultitrackController, useMultitrackSnapshot } from '../../state/editor-store';
import {
  createTimelineTicks,
  createTimelineViewport,
  formatEditorTime,
} from '../waveform/timeline-math';
import { useElementWidth } from '../waveform/use-element-width';

interface MultitrackPanelProps {
  copy: (key: EditorCopyKey) => string;
  onError: (error: string | null) => void;
}

interface TrackStripProps {
  copy: (key: EditorCopyKey) => string;
  index: number;
  onRemove?(trackId: string): void;
  onUpdate?(trackId: string, update: MixerTrackUpdate): void;
  track: AudioTrack | null;
}

function TrackStrip({ copy, index, onRemove, onUpdate, track }: TrackStripProps) {
  const gain = track?.gain ?? 1;
  const pan = track?.pan ?? 0;
  const disabled = track === null;

  return (
    <div
      className={`pk_mt_track${index === 0 ? ' pk_mt_sel' : ''}`}
      data-track={track?.id ?? `placeholder-${index}`}
      style={{ height: 88 }}
    >
      <input
        aria-label={track?.name || `${copy('channels')} ${index + 1}`}
        readOnly
        spellCheck={false}
        type="text"
        value={track?.name ?? ''}
      />
      <button
        aria-label={copy('mute')}
        aria-pressed={track?.muted ?? false}
        className={`pk_mt_mute${track?.muted ? ' pk_act' : ''}${disabled ? ' pk_inact' : ''}`}
        disabled={disabled}
        onClick={() => track && onUpdate?.(track.id, { muted: !track.muted })}
        tabIndex={-1}
        type="button"
      >
        M<span>{copy('mute')}</span>
      </button>
      <button
        aria-label={copy('solo')}
        aria-pressed={track?.solo ?? false}
        className={`pk_mt_solo${track?.solo ? ' pk_act' : ''}${disabled ? ' pk_inact' : ''}`}
        disabled={disabled}
        onClick={() => track && onUpdate?.(track.id, { solo: !track.solo })}
        tabIndex={-1}
        type="button"
      >
        S<span>{copy('solo')}</span>
      </button>
      <label className="pk_mt_knob pk_mt_vol" data-val={`${Math.round(gain * 100)}%`}>
        <i style={{ transform: `rotate(${-135 + gain * 270}deg)` }} />
        <span>{copy('volume')}</span>
        <input
          aria-label={`${copy('volume')}: ${track?.name ?? index + 1}`}
          className="pk_react_visually_hidden"
          disabled={disabled}
          max={1}
          min={0}
          onChange={(event) =>
            track && onUpdate?.(track.id, { gain: Number(event.currentTarget.value) })
          }
          step={0.01}
          type="range"
          value={gain}
        />
      </label>
      <label className="pk_mt_knob pk_mt_pan" data-val={pan.toFixed(2)}>
        <i style={{ transform: `rotate(${pan * 135}deg)` }} />
        <span>{copy('pan')}</span>
        <input
          aria-label={`${copy('pan')}: ${track?.name ?? index + 1}`}
          className="pk_react_visually_hidden"
          disabled={disabled}
          max={1}
          min={-1}
          onChange={(event) =>
            track && onUpdate?.(track.id, { pan: Number(event.currentTarget.value) })
          }
          step={0.01}
          type="range"
          value={pan}
        />
      </label>
      <button
        className={`pk_mt_rec${disabled ? ' pk_inact' : ''}`}
        disabled
        tabIndex={-1}
        type="button"
      >
        R<span>{copy('record')}</span>
      </button>
      <button
        aria-label={track ? `${copy('removeTrack')}: ${track.name}` : copy('removeTrack')}
        className={`pk_mt_del${disabled ? ' pk_inact' : ''}`}
        disabled={disabled}
        onClick={() => track && onRemove?.(track.id)}
        tabIndex={-1}
        type="button"
      >
        ×<span>{copy('removeTrack')}</span>
      </button>
      <b className="pk_mt_resize" />
    </div>
  );
}

export function MultitrackPanel({ copy, onError }: MultitrackPanelProps) {
  const controller = useMultitrackController();
  const snapshot = useMultitrackSnapshot();
  const fileReference = useRef<HTMLInputElement>(null);
  const { reference, width } = useElementWidth<HTMLDivElement>();
  const duration = snapshot.transport.duration;
  const displayTracks = snapshot.project.tracks.length
    ? snapshot.project.tracks
    : ([null, null] as const);
  const laneHeight = displayTracks.length * 88;
  const viewport = useMemo(() => createTimelineViewport(Math.max(duration, 30), 1, 0), [duration]);
  const ticks = useMemo(() => createTimelineTicks(viewport, Math.max(width, 1)), [viewport, width]);
  const crossfadeClips = useMemo(
    () =>
      new Set(
        snapshot.crossfades.flatMap((crossfade) => [crossfade.firstClipId, crossfade.secondClipId]),
      ),
    [snapshot.crossfades],
  );
  const percent = (seconds: number) => `${(seconds / Math.max(duration, 0.001)) * 100}%`;

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

  const seek = (event: PointerEvent<HTMLDivElement>) => {
    if (duration <= 0 || (event.target as Element).closest('.pk_mt_clip')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const seconds = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * duration;
    void run(() => controller.seek(Math.max(0, Math.min(duration, seconds))));
  };

  const updateAll = (update: MixerTrackUpdate) => {
    for (const track of snapshot.project.tracks) controller.updateTrack(track.id, update);
  };

  return (
    <div aria-label={copy('multitrackMixer')} className="pk_mt pk_noselect">
      <input
        accept="audio/*"
        className="pk_react_visually_hidden"
        multiple
        onChange={addFiles}
        ref={fileReference}
        type="file"
      />
      <div className="pk_mt_side">
        <div className="pk_mt_head">
          <button
            aria-label={copy('addTracks')}
            className="pk_mt_add"
            onClick={() => fileReference.current?.click()}
            tabIndex={-1}
            type="button"
          >
            +<span>{copy('addTracks')}</span>
          </button>
          <span>{copy('channels')}</span>
          <button
            aria-label={copy('mute')}
            className={`pk_mt_clear pk_mt_mute${snapshot.project.tracks.some((track) => track.muted) ? '' : ' pk_inact'}`}
            disabled={!snapshot.project.tracks.some((track) => track.muted)}
            onClick={() => updateAll({ muted: false })}
            tabIndex={-1}
            type="button"
          >
            M<span>{copy('mute')}</span>
          </button>
          <button
            aria-label={copy('solo')}
            className={`pk_mt_clear pk_mt_solo${snapshot.project.tracks.some((track) => track.solo) ? '' : ' pk_inact'}`}
            disabled={!snapshot.project.tracks.some((track) => track.solo)}
            onClick={() => updateAll({ solo: false })}
            tabIndex={-1}
            type="button"
          >
            S<span>{copy('solo')}</span>
          </button>
        </div>
        <div className="pk_mt_tracks_wrap">
          <div className="pk_mt_tracks">
            {displayTracks.map((track, index) => (
              <TrackStrip
                copy={copy}
                index={index}
                key={track?.id ?? `placeholder-${index}`}
                onRemove={(trackId) => controller.removeTrack(trackId)}
                onUpdate={(trackId, update) => controller.updateTrack(trackId, update)}
                track={track}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        aria-label={copy('trackTimeline')}
        className="pk_mt_main pk_mt_scroll_unified"
        onPointerDown={seek}
        ref={reference}
        tabIndex={-1}
      >
        <div className="pk_mt_ruler" style={{ width: '100%' }}>
          {ticks.map((tick) => (
            <div className="pk_mt_tick" key={tick.time} style={{ left: `${tick.percent}%` }}>
              {tick.label}
            </div>
          ))}
        </div>
        <div className="pk_mt_lanes" style={{ height: laneHeight, width: '100%' }}>
          {displayTracks.map((track, index) => (
            <div
              className={`pk_mt_lane${index === 0 ? ' pk_mt_sel' : ''}`}
              data-track={track?.id ?? `placeholder-${index}`}
              key={track?.id ?? `placeholder-${index}`}
              style={{ height: 88, top: index * 88 }}
            >
              {track?.clips.map((clip) => (
                <div
                  className={`pk_mt_clip${track.muted ? ' pk_mt_clip_muted' : ''}${crossfadeClips.has(clip.id) ? ' pk_mt_clip_sel' : ''}`}
                  key={clip.id}
                  style={
                    {
                      '--mt-bg': `color-mix(in srgb, ${track.color} 14%, var(--wave-bg))`,
                      '--mt-br': track.color,
                      left: percent(clip.start),
                      width: percent(clip.duration),
                    } as CSSProperties
                  }
                  title={`${clip.name} · ${formatEditorTime(clip.start)}–${formatEditorTime(clip.start + clip.duration)}`}
                >
                  <canvas aria-hidden="true" height={52} width={320} />
                  <span>{clip.name}</span>
                  {clip.fadeIn > 0 ? <i className="pk_mt_fade pk_mt_fade_l" /> : null}
                  {clip.fadeOut > 0 ? <i className="pk_mt_fade pk_mt_fade_r" /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
        {snapshot.project.tracks.length === 0 ? (
          <div className="pk_tmpMsg pk_mt_empty">
            {copy('dropAudioMultiple')}{' '}
            <a
              href="#add-tracks"
              onClick={(event) => {
                event.preventDefault();
                fileReference.current?.click();
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
        {duration > 0 ? (
          <div
            aria-hidden="true"
            className="pk_mt_playhead"
            style={{ height: '100%', left: percent(snapshot.transport.position) }}
          />
        ) : null}
      </div>

      <div className="pk_react_visually_hidden">
        <button
          disabled={duration <= 0}
          onClick={() => void run(() => controller.play())}
          type="button"
        >
          {copy('play')}
        </button>
        <button disabled={duration <= 0} onClick={() => controller.pause()} type="button">
          {copy('pause')}
        </button>
        <button disabled={duration <= 0} onClick={() => controller.stop()} type="button">
          {copy('stop')}
        </button>
        <button
          disabled={duration <= 0}
          onClick={() => void run(() => controller.downloadWav())}
          type="button"
        >
          {copy('exportMix')}
        </button>
        <button
          disabled={duration <= 0}
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
            max={1}
            min={0}
            onChange={(event) => controller.updateMasterGain(Number(event.currentTarget.value))}
            step={0.01}
            type="range"
            value={snapshot.mixer.masterGain}
          />
        </label>
      </div>
    </div>
  );
}
