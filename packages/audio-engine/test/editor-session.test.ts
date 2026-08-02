import { describe, expect, it } from 'vitest';

import { EditorSession, type EditorAudioEngine } from '@audio-engine/application/editor-session';
import { EditHistory } from '@audio-engine/domain/edit-history';
import {
  clampTimelineTime,
  createAudioMarker,
  sortAudioMarkers,
  updateAudioMarker,
} from '@audio-engine/domain/markers';
import type { AudioEngineEvents, AudioEngineSnapshot, PcmAudio } from '@audio-engine/types';
import { mergeRecordedChunks } from '@audio-engine/recording/audio-recorder';

class FakeAudioEngine implements EditorAudioEngine {
  duration = 0;
  private pcm: PcmAudio = { channels: [new Float32Array(0)], sampleRate: 48_000 };
  snapshot: AudioEngineSnapshot = {
    duration: 0,
    position: 0,
    sampleRate: null,
    state: 'idle',
    volume: 1,
  };
  private readonly listeners = new Map<keyof AudioEngineEvents, Set<(value: never) => void>>();

  async close() {
    this.snapshot = { ...this.snapshot, state: 'closed' };
  }

  async load() {
    this.duration = 12;
    this.pcm = {
      channels: [new Float32Array(12 * 48_000).fill(0.25)],
      sampleRate: 48_000,
    };
    this.snapshot = { ...this.snapshot, duration: 12, sampleRate: 48_000, state: 'ready' };
    this.emit('loaded', this.snapshot);
    return this.snapshot;
  }

  loadPcm(audio: PcmAudio) {
    this.pcm = {
      channels: audio.channels.map((channel) => channel.slice()),
      sampleRate: audio.sampleRate,
    };
    this.duration = (audio.channels[0]?.length ?? 0) / audio.sampleRate;
    this.snapshot = {
      ...this.snapshot,
      duration: this.duration,
      position: 0,
      sampleRate: audio.sampleRate,
      state: 'ready',
    };
    this.emit('loaded', this.snapshot);
    return this.snapshot;
  }

  on<Name extends keyof AudioEngineEvents>(
    name: Name,
    listener: (payload: AudioEngineEvents[Name]) => void,
  ) {
    const listeners = this.listeners.get(name) ?? new Set<(value: never) => void>();
    listeners.add(listener as (value: never) => void);
    this.listeners.set(name, listeners);
    return () => listeners.delete(listener as (value: never) => void);
  }

  pause() {
    this.snapshot = { ...this.snapshot, state: 'paused' };
    this.emit('statechange', this.snapshot);
  }

  async play() {
    this.snapshot = { ...this.snapshot, state: 'playing' };
    this.emit('statechange', this.snapshot);
  }

  async seek(seconds: number) {
    this.snapshot = { ...this.snapshot, position: seconds };
    this.emit('position', this.snapshot);
  }

  setVolume(volume: number) {
    this.snapshot = { ...this.snapshot, volume };
    this.emit('volumechange', this.snapshot);
  }

  stop() {
    this.snapshot = { ...this.snapshot, position: 0, state: 'ready' };
    this.emit('statechange', this.snapshot);
  }

  toPcm() {
    return {
      channels: this.pcm.channels.map((channel) => channel.slice()),
      sampleRate: this.pcm.sampleRate,
    };
  }

  private emit<Name extends keyof AudioEngineEvents>(name: Name, payload: AudioEngineEvents[Name]) {
    for (const listener of this.listeners.get(name) ?? []) listener(payload as never);
  }
}

describe('EditHistory', () => {
  it('bounds history and invalidates redo after a new commit', () => {
    const history = new EditHistory(0, 2);
    history.commit(1);
    history.commit(2);
    history.commit(3);

    expect(history.undo().present).toBe(2);
    expect(history.undo().present).toBe(1);
    expect(history.undo().present).toBe(1);
    expect(history.redo().present).toBe(2);
    history.commit(4);
    expect(history.snapshot.canRedo).toBe(false);
  });
});

describe('audio markers', () => {
  it('normalizes input without relying on editor globals', () => {
    const marker = createAudioMarker(
      { color: 'invalid', name: '  Intro\n', time: 15 },
      10,
      'm1',
      0,
    );

    expect(marker).toEqual({
      color: '#9dff6a',
      id: 'm1',
      loop: false,
      name: 'Intro',
      time: 10,
    });
    expect(updateAudioMarker(marker, { time: -2 }, 10).time).toBe(0);
    expect(clampTimelineTime(Number.NaN, 10)).toBe(0);
  });

  it('sorts markers deterministically without mutating the input', () => {
    const input = [
      createAudioMarker({ id: 'm2', time: 2 }, 5, 'unused', 1),
      createAudioMarker({ id: 'm1', time: 1 }, 5, 'unused', 0),
    ];
    const sorted = sortAudioMarkers(input);

    expect(sorted.map((marker) => marker.id)).toEqual(['m1', 'm2']);
    expect(input.map((marker) => marker.id)).toEqual(['m2', 'm1']);
  });
});

describe('EditorSession', () => {
  it('coordinates typed commands, audio state, markers, and undo without globals', async () => {
    const engine = new FakeAudioEngine();
    const session = new EditorSession(engine);
    await session.load(new ArrayBuffer(1), 'voice.wav');
    const loadedRevision = session.snapshot.audioRevision;

    await session.dispatch({ marker: { name: 'Verse', time: 4 }, name: 'marker.add' });
    await session.dispatch({ name: 'playback.seek', seconds: 3 });
    await session.dispatch({ name: 'playback.play' });

    expect(session.snapshot.document.name).toBe('voice.wav');
    expect(session.snapshot.document.markers[0]?.name).toBe('Verse');
    expect(session.snapshot.engine.position).toBe(3);
    expect(session.snapshot.engine.state).toBe('playing');
    expect(session.snapshot.audioRevision).toBe(loadedRevision);

    await session.dispatch({ name: 'history.undo' });
    expect(session.snapshot.document.markers).toEqual([]);
    await session.close();
  });

  it('increments the presentation revision only when rendered PCM changes', async () => {
    const engine = new FakeAudioEngine();
    const session = new EditorSession(engine);
    await session.load(new ArrayBuffer(1), 'voice.wav');
    const loadedRevision = session.snapshot.audioRevision;

    await session.dispatch({ name: 'playback.seek', seconds: 2 });
    await session.dispatch({ marker: { name: 'Verse', time: 2 }, name: 'marker.add' });
    expect(session.snapshot.audioRevision).toBe(loadedRevision);

    await session.dispatch({ name: 'selection.set', range: { end: 2, start: 1 } });
    await session.dispatch({ effectId: 'gain', name: 'effect.preview', values: { amount: 0.5 } });
    expect(session.snapshot.audioRevision).toBe(loadedRevision + 1);

    await session.dispatch({ name: 'effect.preview.cancel' });
    expect(session.snapshot.audioRevision).toBe(loadedRevision + 2);
    await session.close();
  });

  it('stores PCM edits in bounded history and restores engine audio on undo and redo', async () => {
    const engine = new FakeAudioEngine();
    const session = new EditorSession(engine);
    await session.load(new ArrayBuffer(1), 'voice.wav');

    await session.dispatch({ name: 'selection.set', range: { end: 4, start: 2 } });
    await session.dispatch({ name: 'edit.cut' });
    expect(session.snapshot.engine.duration).toBe(10);
    expect(session.snapshot.clipboardFrames).toBe(96_000);

    await session.dispatch({ name: 'history.undo' });
    expect(session.snapshot.engine.duration).toBe(12);
    expect(session.snapshot.document.selection).toEqual({ end: 4, start: 2 });

    await session.dispatch({ name: 'history.redo' });
    expect(session.snapshot.engine.duration).toBe(10);
    expect(session.snapshot.document.selection).toBeNull();
    await session.close();
  });

  it('previews effects without changing history and restores PCM and position on cancel', async () => {
    const engine = new FakeAudioEngine();
    const session = new EditorSession(engine);
    await session.load(new ArrayBuffer(1), 'voice.wav');
    await session.dispatch({ name: 'selection.set', range: { end: 4, start: 2 } });
    await engine.seek(6);

    await session.dispatch({ effectId: 'gain', name: 'effect.preview', values: { amount: 0 } });
    expect(session.snapshot.effectPreviewId).toBe('gain');
    expect(engine.toPcm().channels[0]?.[2 * 48_000]).toBe(0);
    expect(session.getAudio()?.channels[0]?.[2 * 48_000]).toBe(0.25);

    await session.dispatch({ name: 'effect.preview.cancel' });
    expect(session.snapshot.effectPreviewId).toBeNull();
    expect(engine.snapshot.position).toBe(6);
    expect(engine.toPcm().channels[0]?.[2 * 48_000]).toBe(0.25);
    await session.close();
  });

  it('commits selection-scoped effects as one undoable transaction', async () => {
    const engine = new FakeAudioEngine();
    const session = new EditorSession(engine);
    await session.load(new ArrayBuffer(1), 'voice.wav');
    await session.dispatch({ name: 'selection.set', range: { end: 4, start: 2 } });

    await session.dispatch({ effectId: 'gain', name: 'effect.apply', values: { amount: 2 } });
    expect(engine.toPcm().channels[0]?.[2 * 48_000]).toBe(0.5);
    expect(engine.toPcm().channels[0]?.[48_000]).toBe(0.25);

    await session.dispatch({ name: 'history.undo' });
    expect(engine.toPcm().channels[0]?.[2 * 48_000]).toBe(0.25);
    await session.close();
  });

  it('previews, applies, and undoes duration-changing specialized workflows', async () => {
    const engine = new FakeAudioEngine();
    const session = new EditorSession(engine);
    await session.load(new ArrayBuffer(1), 'loop.wav');
    await session.dispatch({ marker: { id: 'after', time: 5 }, name: 'marker.add' });
    await session.dispatch({ name: 'selection.set', range: { end: 4, start: 2 } });
    const workflow = {
      crossfadeMs: 0,
      kind: 'seamless-loop' as const,
      repeat: 2,
      snapZeroCrossing: false,
      trimSilence: false,
    };

    expect(session.supportedSpecializedEffectIds).toEqual([
      'seamless-loop',
      'paragraphic-equalizer',
      'automation',
      'audio-repair',
    ]);
    await session.dispatch({ name: 'specialized-effect.preview', workflow });
    expect(session.snapshot.effectPreviewId).toBe('seamless-loop');
    expect(engine.duration).toBe(14);
    expect(session.getAudio()?.channels[0]).toHaveLength(12 * 48_000);

    await session.dispatch({ name: 'effect.preview.cancel' });
    expect(engine.duration).toBe(12);

    await session.dispatch({ name: 'specialized-effect.apply', workflow });
    expect(engine.duration).toBe(14);
    expect(session.snapshot.document.selection).toEqual({ end: 6, start: 2 });
    expect(session.snapshot.document.markers[0]?.time).toBe(7);

    await session.dispatch({ name: 'history.undo' });
    expect(engine.duration).toBe(12);
    expect(session.snapshot.document.selection).toEqual({ end: 4, start: 2 });
    expect(session.snapshot.document.markers[0]?.time).toBe(5);
    await session.close();
  });
});

describe('AudioRecorder data contract', () => {
  it('merges transferable worklet chunks without changing their order', () => {
    const merged = mergeRecordedChunks([
      new Float32Array([0.1, 0.2]),
      new Float32Array([-0.5, 0.75]),
    ]);
    expect(Array.from(merged)).toEqual([expect.closeTo(0.1), expect.closeTo(0.2), -0.5, 0.75]);
  });
});
