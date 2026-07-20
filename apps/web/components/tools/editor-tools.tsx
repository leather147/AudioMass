'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import type { EditorToolId } from '@/lib/editor-tool-routes';
import { editorCopy } from '@/lib/editor-copy';
import type { EditorLocale } from '@/lib/editor-preferences';

import styles from './editor-tools.module.css';

type FrequencyData = ArrayLike<number> | null | undefined;

interface MixerTrack {
  id: string;
  meter: number;
  mute: boolean;
  name: string;
  pan: number;
  rec: boolean;
  sel: boolean;
  solo: boolean;
  vol: number;
}

interface MixerData {
  master: { meter: number; vol: number };
  on: boolean;
  tracks: MixerTrack[];
}

interface EditorRuntimeWindow extends Window {
  AMI18n?: { getLocale(): string };
  AMTheme?: { get(): { id: string } };
  AMThemeRegistry?: {
    get(id: string): { id: string; mode: string };
    tokens(id: string): Record<string, string>;
  };
  PKAudioEditor?: {
    multitrack?: {
      MixerData(): MixerData;
      MixerSet(id: string, key: string, value: boolean | number | string, done: number): boolean;
    };
    ui: { Dock(event: string, toolOrKey: EditorToolId | number, data?: unknown): void };
  };
  destroy?: (embedded?: number) => void;
  update?: (data: FrequencyData) => void;
}

function runtimeWindow(value: Window | null): EditorRuntimeWindow | null {
  return value as EditorRuntimeWindow | null;
}

function getHost(embedded: boolean) {
  try {
    return runtimeWindow(embedded ? window.parent : window.opener);
  } catch {
    return null;
  }
}

function subscribeStatic() {
  return () => undefined;
}

function embeddedSnapshot() {
  return new URLSearchParams(window.location.search).get('embedded') === '1';
}

function localeSnapshot(embedded: boolean, fallback: EditorLocale): EditorLocale {
  const value = getHost(embedded)?.AMI18n?.getLocale() ?? fallback;
  return value === 'en' ? 'en' : 'ru';
}

function useEditorTool(tool: EditorToolId, initialLocale: EditorLocale) {
  const embedded = useSyncExternalStore(subscribeStatic, embeddedSnapshot, () => false);
  const subscribeLocale = useCallback(
    (notify: () => void) => {
      const host = getHost(embedded);
      host?.addEventListener('am:localechange', notify);
      return () => host?.removeEventListener('am:localechange', notify);
    },
    [embedded],
  );
  const getLocaleSnapshot = useCallback(
    () => localeSnapshot(embedded, initialLocale),
    [embedded, initialLocale],
  );
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => initialLocale);

  useEffect(() => {
    const host = getHost(embedded);

    const applyTheme = (event?: Event) => {
      const source = getHost(embedded);
      const detail = (
        event as
          | CustomEvent<{
              id?: string;
              theme?: { id: string; mode: string };
              tokens?: Record<string, string>;
            }>
          | undefined
      )?.detail;
      const id = detail?.id ?? source?.AMTheme?.get().id ?? 'replicate';
      const theme = detail?.theme ?? source?.AMThemeRegistry?.get(id);
      const tokens = detail?.tokens ?? source?.AMThemeRegistry?.tokens(id);
      if (!theme || !tokens) return;
      for (const [key, value] of Object.entries(tokens)) {
        document.documentElement.style.setProperty(`--${key}`, value);
      }
      document.documentElement.dataset.theme = theme.id;
      document.documentElement.dataset.themeMode = theme.mode;
      document.documentElement.style.colorScheme = theme.mode;
    };

    applyTheme();
    host?.addEventListener('am:themechange', applyTheme);

    const notifyClosed = () => {
      const current = runtimeWindow(window);
      current?.destroy?.(embedded ? 1 : 0);
      if (current) current.destroy = undefined;
    };
    window.addEventListener('beforeunload', notifyClosed);
    return () => {
      host?.removeEventListener('am:themechange', applyTheme);
      window.removeEventListener('beforeunload', notifyClosed);
    };
  }, [embedded]);

  useEffect(() => {
    let lastPress = 0;
    const forwardSpace = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.timeStamp - lastPress < 100) return;
      event.preventDefault();
      event.stopPropagation();
      lastPress = event.timeStamp;
      getHost(embedded)?.PKAudioEditor?.ui.Dock('RequestKeyDown', 32);
    };
    document.addEventListener('keydown', forwardSpace, true);
    return () => document.removeEventListener('keydown', forwardSpace, true);
  }, [embedded]);

  const closeEmbedded = useCallback(() => {
    getHost(true)?.PKAudioEditor?.ui.Dock('RequestShowFreqAn', tool, [1, 1]);
  }, [tool]);

  const dock = useCallback(() => {
    const host = getHost(embedded);
    if (!host?.PKAudioEditor) return;
    if (!embedded) {
      host.PKAudioEditor.ui.Dock('RequestShowFreqAn', tool, [1, 1]);
      window.close();
      return;
    }

    const frame = host.document.getElementById(`pk_fr${tool}`);
    const rect = frame?.getBoundingClientRect();
    const position = rect ? [host.screenLeft + rect.left + 100, host.screenTop + rect.top + 25] : 1;
    host.PKAudioEditor.ui.Dock('RequestShowFreqAn', tool, [position, 0]);
  }, [embedded, tool]);

  const drag = useCallback(
    (event: ReactPointerEvent) => {
      if (!embedded) return;
      event.preventDefault();
      event.stopPropagation();
      getHost(true)?.PKAudioEditor?.ui.Dock('RequestDragI', tool, [event.screenX, event.screenY]);
    },
    [embedded, tool],
  );

  return { closeEmbedded, dock, drag, embedded, locale };
}

type EditorToolController = ReturnType<typeof useEditorTool>;

function ToolControls({ controller }: { controller: EditorToolController }) {
  const { closeEmbedded, dock, drag, embedded, locale } = controller;
  return (
    <>
      {embedded ? (
        <button
          aria-label={editorCopy(locale, 'close')}
          className={styles.close}
          onClick={closeEmbedded}
          type="button"
        >
          ×
        </button>
      ) : null}
      <button className={styles.dock} onClick={dock} type="button">
        {editorCopy(locale, embedded ? 'return' : 'dock')}
      </button>
      {embedded ? (
        <button
          aria-label={editorCopy(locale, 'dragPanel')}
          className={styles.drag}
          onPointerDown={drag}
          type="button"
        />
      ) : null}
    </>
  );
}

function canvasColor(name: string, fallback: string) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || fallback
  );
}

function spectralColor(value: number) {
  const colors: [number, number, number][] = [
    [0, 0, 0],
    [75, 0, 159],
    [104, 0, 251],
    [131, 0, 255],
    [155, 18, 157],
    [175, 37, 0],
    [191, 59, 0],
    [206, 88, 0],
    [223, 132, 0],
    [240, 188, 0],
    [255, 252, 0],
  ];
  const normalized = Math.max(0, Math.min(100, (value / 255) * 100));
  const lower = Math.min(9, Math.floor(normalized / 10));
  const progress = (normalized - lower * 10) / 10;
  const start = colors[lower] ?? colors[0]!;
  const end = colors[lower + 1] ?? colors.at(-1)!;
  return `rgb(${start.map((channel, index) => Math.round(channel + (end[index]! - channel) * progress)).join(',')})`;
}

export function AnalyserTool({
  initialLocale,
  kind,
}: {
  initialLocale: EditorLocale;
  kind: 'frequency' | 'spectral';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const latestRef = useRef<FrequencyData>(null);
  const [hasData, setHasData] = useState(false);
  const tool = kind === 'frequency' ? 'eq' : 'sp';
  const controller = useEditorTool(tool, initialLocale);
  const { locale } = controller;

  const draw = useCallback(() => {
    frameRef.current = null;
    const canvas = canvasRef.current;
    const values = latestRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    const width = Math.max(1, Math.floor(canvas.clientWidth));
    const height = Math.max(1, Math.floor(canvas.clientHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const background = canvasColor('background', '#050607');
    if (!values) {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      setHasData(false);
      return;
    }
    setHasData(true);

    if (kind === 'frequency') {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      const bars = 240;
      const barWidth = width / bars;
      context.fillStyle = canvasColor('ring', '#43e4dc');
      for (let index = 0; index < bars; index += 1) {
        const value = Number(values[index * 2] ?? 0);
        const barHeight = Math.floor((value / 256) * height);
        context.fillRect(index * barWidth, height - barHeight, Math.ceil(barWidth), barHeight);
      }
      return;
    }

    const speed = 3;
    context.drawImage(canvas, -speed, 0);
    context.fillStyle = background;
    context.fillRect(width - speed, 0, speed, height);
    for (let index = 0; index < values.length; index += 1) {
      const y = height - Math.round((index / values.length) * height);
      context.fillStyle = spectralColor(Number(values[index] ?? 0));
      context.fillRect(width - speed, y, speed, Math.max(1, speed));
    }
  }, [kind]);

  useEffect(() => {
    const current = runtimeWindow(window);
    if (!current) return;
    current.update = (values) => {
      latestRef.current = values;
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(draw);
    if (canvasRef.current) resize.observe(canvasRef.current);
    draw();
    return () => {
      current.update = undefined;
      resize.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  const title = editorCopy(locale, kind === 'frequency' ? 'frequencyAnalyser' : 'spectralAnalyser');

  return (
    <main className={styles.toolPage}>
      <canvas aria-label={title} className={styles.canvas} ref={canvasRef} />
      {!hasData ? <div className={styles.empty}>{title}</div> : null}
      <ToolControls controller={controller} />
    </main>
  );
}

function panText(value: number) {
  if (value < -0.01) return `L${Math.floor(-value * 100)}`;
  if (value > 0.01) return `R${Math.floor(value * 100)}`;
  return 'C';
}

interface MixerStripProps {
  master?: boolean;
  onSet(id: string, key: string, value: boolean | number, done: number): void;
  track: MixerTrack;
}

function MixerStrip({ master = false, onSet, track }: MixerStripProps) {
  const setPan = (value: number, done: number) =>
    onSet(track.id, 'pan', Math.max(-1, Math.min(1, value)), done);

  const startPan = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const origin = { value: track.pan, x: event.clientX, y: event.clientY };
    let current = origin.value;
    const move = (next: PointerEvent) => {
      current = Math.max(
        -1,
        Math.min(1, origin.value + (next.clientX - origin.x - next.clientY + origin.y) / 80),
      );
      setPan(current, 0);
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      setPan(current, 1);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, { once: true });
  };

  return (
    <section
      className={`${styles.strip} ${master ? styles.master : ''} ${track.sel ? styles.selected : ''}`}
      onClick={() => !master && onSet(track.id, 'select', true, 1)}
    >
      <strong title={track.name}>{track.name}</strong>
      <div className={styles.meter}>
        <i style={{ transform: `scaleX(${track.meter || 0})` }} />
      </div>
      {master ? (
        <label>LEVEL</label>
      ) : (
        <>
          <p>
            {(['mute', 'solo', 'rec'] as const).map((key) => (
              <button
                className={track[key] ? styles.active : ''}
                key={key}
                onClick={(event) => {
                  event.stopPropagation();
                  onSet(track.id, key, !track[key], 1);
                }}
                type="button"
              >
                {key.charAt(0).toUpperCase()}
              </button>
            ))}
          </p>
          <div className={styles.pan}>
            <label>PAN</label>
            <button
              aria-label={`Pan ${panText(track.pan)}`}
              className={styles.knob}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={() => setPan(0, 1)}
              onPointerDown={startPan}
              type="button"
            >
              <i style={{ transform: `rotate(${track.pan * 65}deg)` }} />
            </button>
            <em>{panText(track.pan)}</em>
          </div>
        </>
      )}
      <input
        aria-label={`${track.name} volume`}
        className={styles.volume}
        max="1"
        min="0"
        onBlur={(event) => onSet(track.id, 'vol', Number(event.currentTarget.value), 1)}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={() => onSet(track.id, 'vol', 1, 1)}
        onInput={(event) => onSet(track.id, 'vol', Number(event.currentTarget.value), 0)}
        onKeyUp={(event) => onSet(track.id, 'vol', Number(event.currentTarget.value), 1)}
        onPointerUp={(event) => onSet(track.id, 'vol', Number(event.currentTarget.value), 1)}
        step=".01"
        type="range"
        value={track.vol}
      />
      <output>{Math.floor(track.vol * 100)}%</output>
    </section>
  );
}

export function MixerTool({ initialLocale }: { initialLocale: EditorLocale }) {
  const [data, setData] = useState<MixerData | null>(null);
  const controller = useEditorTool('mix', initialLocale);
  const { locale } = controller;

  useEffect(() => {
    let frame = 0;
    let last = 0;
    const poll = (time: number) => {
      if (time - last > 50) {
        last = time;
        const next = getHost(
          new URLSearchParams(window.location.search).get('embedded') === '1',
        )?.PKAudioEditor?.multitrack?.MixerData();
        setData(next?.on ? next : null);
      }
      frame = window.requestAnimationFrame(poll);
    };
    frame = window.requestAnimationFrame(poll);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setValue = useCallback((id: string, key: string, value: boolean | number, done: number) => {
    const embedded = new URLSearchParams(window.location.search).get('embedded') === '1';
    getHost(embedded)?.PKAudioEditor?.multitrack?.MixerSet(id, key, value, done);
  }, []);

  const master: MixerTrack | null = data
    ? {
        id: 'master',
        meter: data.master.meter,
        mute: false,
        name: 'Master',
        pan: 0,
        rec: false,
        sel: false,
        solo: false,
        vol: data.master.vol,
      }
    : null;

  return (
    <main className={`${styles.toolPage} ${styles.mixerPage}`}>
      <div className={styles.mixer}>
        {data ? (
          data.tracks.map((track) => <MixerStrip key={track.id} onSet={setValue} track={track} />)
        ) : (
          <div className={styles.empty}>{editorCopy(locale, 'openMultitrack')}</div>
        )}
        {master ? <MixerStrip master onSet={setValue} track={master} /> : null}
      </div>
      <ToolControls controller={controller} />
    </main>
  );
}
