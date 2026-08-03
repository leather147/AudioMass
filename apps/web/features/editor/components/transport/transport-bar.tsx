'use client';

import type { EditorSessionSnapshot, MultitrackSessionSnapshot } from '@audiomass/audio-engine';
import { useEffect, useRef, useState } from 'react';

import type { EditorCopyKey } from '@/lib/editor-copy';

import type { EditorController } from '../../application/editor-controller';
import type { MultitrackController } from '../../application/multitrack-controller';
import { formatEditorTime } from '../waveform/timeline-math';

interface TransportBarProps {
  controller: EditorController;
  copy: (key: EditorCopyKey) => string;
  documentName: string;
  mode?: 'multitrack' | 'waveform';
  multitrackController?: MultitrackController;
  multitrackSnapshot?: MultitrackSessionSnapshot;
  onWaveformView?(): void;
  snapshot: EditorSessionSnapshot;
}

interface ClassicButtonProps {
  active?: boolean;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick(): void;
}

function ClassicButton({
  active = false,
  className = '',
  disabled = false,
  label,
  onClick,
}: ClassicButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active || undefined}
      className={`pk_btn ${className}${active ? ' pk_act' : ''}${disabled ? ' pk_inact' : ''}`}
      disabled={disabled}
      onClick={onClick}
      tabIndex={-1}
      title={label}
      type="button"
    >
      <span>{label}</span>
    </button>
  );
}

function clockTime(seconds: number) {
  return formatEditorTime(seconds).replace('.', ':');
}

function TimingCanvas({ value }: { value: string }) {
  const reference = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = reference.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const foreground = getComputedStyle(canvas).getPropertyValue('--foreground').trim() || '#fff';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = foreground;
    context.font = '29px Helvetica, Arial, sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(value, 0, 21);
  }, [value]);

  return (
    <canvas aria-label={value} className="pk_timingcnv" height={40} ref={reference} width={150} />
  );
}

function CompositionOverview({ loaded }: { loaded: boolean }) {
  const reference = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = reference.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const style = getComputedStyle(canvas);
    const accent = style.getPropertyValue('--ring').trim() || '#43e4dc';
    const muted = style.getPropertyValue('--muted-foreground').trim() || '#77838d';
    const warning = style.getPropertyValue('--warn').trim() || '#e0af68';
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = muted;
    context.globalAlpha = 0.18;
    context.lineWidth = 0.5;
    for (let x = 8; x < 146; x += 12) {
      context.beginPath();
      context.moveTo(x, 3);
      context.lineTo(x, 43);
      context.stroke();
    }

    context.strokeStyle = accent;
    context.globalAlpha = loaded ? 0.9 : 0.42;
    context.beginPath();
    for (let x = 3; x < 145; x += 1) {
      const envelope = loaded ? 7 + Math.abs(Math.sin(x * 0.19)) * 10 : 2;
      const y = 22 + Math.sin(x * 0.47) * envelope * 0.48 + Math.sin(x * 0.13) * 2;
      if (x === 3) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    context.globalAlpha = 0.72;
    for (let index = 0; index < 8; index += 1) {
      context.fillStyle = index < (loaded ? 7 : 4) ? warning : muted;
      context.fillRect(153, 5 + index * 4.5, 27, 2.5);
    }
    context.globalAlpha = 1;
  }, [loaded]);

  return <canvas aria-hidden="true" height={48} ref={reference} width={188} />;
}

function MarkerIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M12 3v14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M12 3l7 4.2-7 4.2L5 7.2 12 3z" fill="currentColor" opacity=".94" />
      <path d="M12 17l-3 4h6l-3-4z" fill="currentColor" opacity=".86" />
    </svg>
  );
}

function RenameIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M4 7.5h10.5"
        fill="none"
        opacity=".82"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M4 12h8"
        fill="none"
        opacity=".64"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M4 16.5h5.5"
        fill="none"
        opacity=".46"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M13.2 17.8l1.1-4.2 5.8-5.8a1.7 1.7 0 0 1 2.4 2.4l-5.8 5.8-4.2 1.1.7-2.9z"
        fill="currentColor"
        opacity=".96"
      />
      <path
        d="M18.8 8.9l2.3 2.3"
        fill="none"
        opacity=".72"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function TransportBar({
  controller,
  copy,
  documentName,
  mode = 'waveform',
  multitrackController,
  multitrackSnapshot,
  onWaveformView,
  snapshot,
}: TransportBarProps) {
  const [loop, setLoop] = useState(false);
  const [beats, setBeats] = useState(false);
  const [bpm, setBpm] = useState(120);
  const multitrackMode = mode === 'multitrack' && multitrackController && multitrackSnapshot;
  const position = multitrackMode
    ? multitrackSnapshot.transport.position
    : snapshot.engine.position;
  const duration = multitrackMode
    ? multitrackSnapshot.transport.duration
    : snapshot.engine.duration;
  const loaded = duration > 0;
  const selection = multitrackMode ? null : snapshot.document.selection;
  const selectionDuration = selection ? selection.end - selection.start : 0;
  const seek = (seconds: number) => {
    const nextPosition = Math.max(0, Math.min(duration, seconds));
    if (multitrackMode) {
      void multitrackController.seek(nextPosition);
      return;
    }
    void controller.dispatch({ name: 'playback.seek', seconds: nextPosition });
  };

  const play = () => {
    if (multitrackMode) void multitrackController.play();
    else void controller.dispatch({ name: 'playback.play' });
  };

  const pause = () => {
    if (multitrackMode) multitrackController.pause();
    else void controller.dispatch({ name: 'playback.pause' });
  };

  const stop = () => {
    if (multitrackMode) multitrackController.stop();
    else void controller.dispatch({ name: 'playback.stop' });
  };

  const addMarker = () => {
    if (!loaded || multitrackMode) return;
    void controller.dispatch({
      marker: {
        name: `${copy('markers')} ${snapshot.document.markers.length + 1}`,
        time: position,
      },
      name: 'marker.add',
    });
  };

  const renameDocument = () => {
    const value = window.prompt(copy('documentName'), documentName)?.trim();
    if (value) void controller.dispatch({ name: 'document.rename', value });
  };

  return (
    <div className="pk_tbc">
      <div className="pk_tb pk_noselect">
        <div className="pk_timecontainer">
          <TimingCanvas value={clockTime(position)} />
          <span className="pk_total_dur">{clockTime(duration)}</span>
          <span className="pk_hover_dur">{clockTime(selectionDuration)}</span>
        </div>

        <div className="pk_btngroup">
          <div className="pk_transport">
            <ClassicButton
              className="pk_stop icon-stop2"
              disabled={!loaded}
              label={copy('stop')}
              onClick={stop}
            />
            <ClassicButton
              className="pk_play icon-play3"
              disabled={!loaded}
              label={copy('play')}
              onClick={play}
            />
            <ClassicButton
              className="pk_pause icon-pause2"
              disabled={!loaded}
              label={copy('pause')}
              onClick={pause}
            />
            <ClassicButton
              active={loop}
              className="pk_loop icon-loop"
              disabled={!loaded}
              label={copy('loop')}
              onClick={() => setLoop((value) => !value)}
            />
            <ClassicButton
              className="pk_back_jump icon-backward2"
              disabled={!loaded}
              label={copy('selectionStart')}
              onClick={() => seek(position - Math.max(duration / 20, 0.5))}
            />
            <ClassicButton
              className="pk_front_jump icon-forward3"
              disabled={!loaded}
              label={copy('selectionEnd')}
              onClick={() => seek(position + Math.max(duration / 20, 0.5))}
            />
            <ClassicButton
              className="icon-previous2"
              disabled={!loaded}
              label={copy('selectionStart')}
              onClick={() => seek(selection?.start ?? 0)}
            />
            <ClassicButton
              className="icon-next2"
              disabled={!loaded}
              label={copy('selectionEnd')}
              onClick={() => seek(selection?.end ?? duration)}
            />
            <ClassicButton
              className="icon-rec"
              disabled
              label={copy('record')}
              onClick={() => undefined}
            />
          </div>

          <div className="pk_ctns">
            <ClassicButton
              className="icon-files-empty"
              disabled={!selection || Boolean(multitrackMode)}
              label={copy('copy')}
              onClick={() => void controller.dispatch({ name: 'edit.copy' })}
            />
            <ClassicButton
              className="icon-file-text2"
              disabled={!snapshot.clipboardFrames || Boolean(multitrackMode)}
              label={copy('paste')}
              onClick={() => void controller.dispatch({ name: 'edit.paste' })}
            />
            <ClassicButton
              className="icon-scissors"
              disabled={!selection || Boolean(multitrackMode)}
              label={copy('cut')}
              onClick={() => void controller.dispatch({ name: 'edit.cut' })}
            />
            <ClassicButton
              className="icon-silence"
              disabled={!loaded || Boolean(multitrackMode)}
              label={copy('insertSilence')}
              onClick={() => void controller.dispatch({ duration: 1, name: 'edit.insert-silence' })}
            />
          </div>
        </div>

        <button
          aria-pressed={!multitrackMode}
          className={`pk_btn pk_wave_view_toggle${multitrackMode ? '' : ' pk_act'}`}
          onClick={multitrackMode ? onWaveformView : undefined}
          tabIndex={-1}
          type="button"
        >
          <b>{copy('focus')}</b>
          <span>{copy('waveform')}</span>
        </button>
        <button
          aria-label={copy('fullscreen')}
          aria-pressed={false}
          className="pk_btn pk_fullscreen_toggle"
          onClick={() => void document.documentElement.requestFullscreen?.()}
          tabIndex={-1}
          type="button"
        >
          <b>{copy('fullscreen')}</b>
          <span>{copy('fullscreen')}</span>
        </button>

        <button
          aria-label={copy('addAtCursor')}
          className={`pk_marker_add_btn${loaded ? '' : ' pk_disabled'}`}
          disabled={!loaded || Boolean(multitrackMode)}
          onClick={addMarker}
          tabIndex={-1}
          title={copy('addAtCursor')}
          type="button"
        >
          <MarkerIcon />
          <span>{copy('marker')}</span>
        </button>
        <button
          aria-label={copy('documentName')}
          className={`pk_clip_rename_btn${loaded ? '' : ' pk_disabled'}`}
          disabled={!loaded || Boolean(multitrackMode)}
          onClick={renameDocument}
          tabIndex={-1}
          title={copy('documentName')}
          type="button"
        >
          <RenameIcon />
          <span>{copy('documentName')}</span>
        </button>

        <div aria-label={copy('waveform')} className="pk_comp_wave_badge" title={documentName}>
          <CompositionOverview loaded={loaded} />
          <span className="pk_comp_wave_label">waveform</span>
          <span className="pk_comp_wave_eye" />
        </div>

        <div className="pk_selection">
          <div className="pk_sellist">
            <span className="pk_title">{copy('selection')}:</span>
            <div>
              <span className="title">{copy('selectionStart')}:</span>
              <span className="s_s pk_dat">
                {selection ? formatEditorTime(selection.start) : '-'}
              </span>
            </div>
            <div>
              <span className="title">{copy('selectionEnd')}:</span>
              <span className="s_e pk_dat">
                {selection ? formatEditorTime(selection.end) : '-'}
              </span>
            </div>
            <div>
              <span className="title">{copy('duration')}:</span>
              <span className="s_d pk_dat">
                {selection ? formatEditorTime(selectionDuration) : '-'}
              </span>
            </div>
          </div>
          <ClassicButton
            className="icon-clearsel"
            disabled={!selection}
            label={copy('selection')}
            onClick={() => void controller.dispatch({ name: 'selection.clear' })}
          />
        </div>

        <div className="pk_mtbeat">
          <button
            className={`pk_btn pk_mtbeat_btn${beats ? ' pk_act' : ''}`}
            onClick={() => setBeats((value) => !value)}
            tabIndex={-1}
            type="button"
          >
            БИТ<span>БИТ</span>
          </button>
          <button
            aria-disabled={!beats}
            className={`pk_btn pk_mtbeat_btn pk_mtbeat_snap${beats ? '' : ' pk_inact'}`}
            disabled={!beats}
            tabIndex={-1}
            type="button"
          >
            СНАП<span>СНАП</span>
          </button>
          <input
            aria-label="BPM"
            className="pk_mtbeat_bpm pk_bpm"
            inputMode="numeric"
            onChange={(event) => setBpm(Number(event.target.value) || 0)}
            pattern="[0-9]*"
            title="BPM"
            type="text"
            value={bpm}
          />
          <b>БПМ</b>
          <button className="pk_btn pk_mtbeat_sig" tabIndex={-1} type="button">
            4/4<span>4/4</span>
          </button>
        </div>
      </div>
    </div>
  );
}
