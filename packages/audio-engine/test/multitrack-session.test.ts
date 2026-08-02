import { describe, expect, it } from 'vitest';

import {
  createAudioProject,
  InMemoryAudioSourceRepository,
  MultitrackSession,
  type AudioCrossfade,
  type AudioProject,
  type AudioSourceRepository,
  type MixerState,
  type MultitrackPlaybackEvents,
  type MultitrackPlaybackPort,
  type MultitrackPlaybackSnapshot,
} from '@audio-engine/index';

class FakePlayback implements MultitrackPlaybackPort {
  snapshot: MultitrackPlaybackSnapshot = {
    duration: 0,
    position: 0,
    sampleRate: null,
    state: 'idle',
  };
  readonly listeners = new Map<keyof MultitrackPlaybackEvents, Set<(value: never) => void>>();
  project: AudioProject | null = null;

  async close(): Promise<void> {
    this.snapshot = { ...this.snapshot, state: 'closed' };
  }

  configure(
    project: AudioProject,
    _sources: AudioSourceRepository,
    _mixer: MixerState,
    _crossfades: readonly AudioCrossfade[],
  ): void {
    this.project = project;
    const duration = project.tracks.reduce(
      (maximum, track) =>
        track.clips.reduce(
          (trackMaximum, clip) => Math.max(trackMaximum, clip.start + clip.duration),
          maximum,
        ),
      0,
    );
    this.snapshot = {
      duration,
      position: Math.min(this.snapshot.position, duration),
      sampleRate: project.sampleRate,
      state: duration > 0 ? 'ready' : 'idle',
    };
  }

  on<Name extends keyof MultitrackPlaybackEvents>(
    name: Name,
    listener: (payload: MultitrackPlaybackEvents[Name]) => void,
  ): () => void {
    const listeners = this.listeners.get(name) ?? new Set<(value: never) => void>();
    listeners.add(listener as (value: never) => void);
    this.listeners.set(name, listeners);
    return () => listeners.delete(listener as (value: never) => void);
  }

  pause(): void {
    this.snapshot = { ...this.snapshot, state: 'paused' };
  }

  async play(): Promise<void> {
    this.snapshot = { ...this.snapshot, state: 'playing' };
  }

  async seek(seconds: number): Promise<void> {
    this.snapshot = { ...this.snapshot, position: seconds };
  }

  stop(): void {
    this.snapshot = { ...this.snapshot, position: 0, state: this.project ? 'ready' : 'idle' };
  }

  syncMixer(project: AudioProject): void {
    this.project = project;
  }
}

describe('native multitrack application session', () => {
  it('owns PCM sources and coordinates mixer state with deterministic bounce', async () => {
    const input = Float32Array.from([1, 1, 1, 1]);
    const repository = new InMemoryAudioSourceRepository();
    repository.set('ownership', { channels: [input], sampleRate: 4 });
    input[0] = 0;
    const firstRead = repository.get('ownership')!;
    firstRead.channels[0]![1] = 0;
    expect(Array.from(repository.get('ownership')!.channels[0]!)).toEqual([1, 1, 1, 1]);

    const playback = new FakePlayback();
    const session = new MultitrackSession(
      createAudioProject({ id: 'mix', name: 'Mix' }),
      playback,
      repository,
    );
    session.addSource({
      audio: { channels: [Float32Array.from([1, 1, 1, 1])], sampleRate: 4 },
      clipId: 'clip',
      name: 'Voice',
      sourceId: 'voice-source',
      trackId: 'voice-track',
    });
    session.updateTrack('voice-track', { pan: -1 });
    session.updateMasterGain(0.5);

    expect(session.snapshot.project.tracks[0]).toMatchObject({ name: 'Voice', pan: -1 });
    expect(session.snapshot.transport).toMatchObject({ duration: 1, state: 'ready' });
    expect(Array.from(session.bounce()!.channels[0]!)).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(Array.from(session.bounce()!.channels[1]!)).toEqual([0, 0, 0, 0]);

    const restoredSources = new InMemoryAudioSourceRepository();
    const restored = new MultitrackSession(
      createAudioProject({ id: 'restored', name: 'Restored' }),
      new FakePlayback(),
      restoredSources,
    );
    restored.loadDocument(session.createDocument());
    expect(restored.snapshot).toMatchObject({
      mixer: { masterGain: 0.5 },
      project: { id: 'mix', tracks: [{ id: 'voice-track' }] },
    });
    expect(Array.from(restored.bounce()!.channels[0]!)).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(restoredSources.has('voice-source')).toBe(true);

    session.removeTrack('voice-track');
    expect(session.bounce()).toBeNull();
    expect(session.snapshot.project.tracks).toEqual([]);
    expect(repository.has('voice-source')).toBe(false);
    await session.close();
    await restored.close();
    expect(playback.snapshot.state).toBe('closed');
  });
});
