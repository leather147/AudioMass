import { describe, expect, it } from 'vitest';

import {
  addClip,
  addTrack,
  createAudioClip,
  createAudioProject,
  createAudioTrack,
  createCrossfade,
  InMemoryAudioSourceRepository,
  MultitrackPlayback,
  type AudioProject,
} from '@audio-engine/index';

class FakeAudioParam {
  curve: Float32Array | null = null;
  value = 0;

  cancelScheduledValues(): void {}

  setValueAtTime(value: number): void {
    this.value = value;
  }

  setValueCurveAtTime(curve: Float32Array): void {
    this.curve = curve;
  }
}

class FakeNode {
  readonly connections: FakeNode[] = [];

  connect(destination: FakeNode): FakeNode {
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void {
    this.connections.length = 0;
  }
}

class FakeGainNode extends FakeNode {
  readonly gain = new FakeAudioParam();
}

class FakeStereoPannerNode extends FakeNode {
  readonly pan = new FakeAudioParam();
}

class FakeAudioBuffer {
  readonly channels: Float32Array[];
  readonly duration: number;

  constructor(
    readonly numberOfChannels: number,
    readonly length: number,
    readonly sampleRate: number,
  ) {
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    this.duration = length / sampleRate;
  }

  copyToChannel(source: Float32Array, channel: number): void {
    this.channels[channel]?.set(source);
  }
}

class FakeSourceNode extends FakeNode {
  buffer: FakeAudioBuffer | null = null;
  duration = 0;
  offset = 0;
  onended: (() => void) | null = null;
  stopped = false;
  when = 0;

  start(when: number, offset: number, duration: number): void {
    this.when = when;
    this.offset = offset;
    this.duration = duration;
  }

  stop(): void {
    this.stopped = true;
  }
}

class FakeAudioContext {
  currentTime = 10;
  readonly destination = new FakeNode();
  readonly gains: FakeGainNode[] = [];
  readonly sampleRate = 4;
  readonly sources: FakeSourceNode[] = [];
  state: AudioContextState = 'running';

  async close(): Promise<void> {
    this.state = 'closed';
  }

  createBuffer(channels: number, length: number, sampleRate: number): FakeAudioBuffer {
    return new FakeAudioBuffer(channels, length, sampleRate);
  }

  createBufferSource(): FakeSourceNode {
    const source = new FakeSourceNode();
    this.sources.push(source);
    return source;
  }

  createGain(): FakeGainNode {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  createStereoPanner(): FakeStereoPannerNode {
    return new FakeStereoPannerNode();
  }

  async resume(): Promise<void> {}
}

function playbackProject(): AudioProject {
  let project = addTrack(
    createAudioProject({ id: 'project', name: 'Playback', sampleRate: 4 }),
    createAudioTrack({ id: 'track', name: 'Track' }),
  );
  project = addClip(
    project,
    'track',
    createAudioClip({
      duration: 4,
      fadeOut: 1,
      id: 'active',
      name: 'Active',
      offset: 0.5,
      sourceId: 'active-source',
      start: 0,
    }),
  );
  return addClip(
    project,
    'track',
    createAudioClip({
      duration: 2,
      id: 'future',
      name: 'Future',
      sourceId: 'future-source',
      start: 5,
    }),
  );
}

describe('native multitrack Web Audio playback', () => {
  it('schedules active and delayed clips with offsets, envelopes, and owned cleanup', async () => {
    const context = new FakeAudioContext();
    const sources = new InMemoryAudioSourceRepository();
    sources.set('active-source', { channels: [new Float32Array(32).fill(1)], sampleRate: 4 });
    sources.set('future-source', { channels: [new Float32Array(12).fill(0.5)], sampleRate: 4 });
    const playback = new MultitrackPlayback({
      contextFactory: () => context as unknown as AudioContext,
      monitorIntervalMs: 60_000,
    });
    playback.configure(playbackProject(), sources, { masterGain: 0.75 }, []);

    await playback.seek(1);
    await playback.play();

    expect(context.sources).toHaveLength(2);
    expect(context.sources[0]).toMatchObject({ duration: 3, offset: 1.5, when: 10 });
    expect(context.sources[1]).toMatchObject({ duration: 2, offset: 0, when: 14 });
    const envelopeNodes = context.gains.filter((gain) => gain.gain.curve);
    expect(envelopeNodes).toHaveLength(2);
    expect(envelopeNodes[0]?.gain.curve?.at(-1)).toBeCloseTo(0);
    expect(playback.snapshot).toMatchObject({ position: 1, state: 'playing' });

    playback.pause();
    expect(context.sources.every((source) => source.stopped)).toBe(true);
    expect(playback.snapshot.state).toBe('paused');
    await playback.close();
    expect(context.state).toBe('closed');
  });

  it('fails before partially scheduling when a source is unavailable', async () => {
    const context = new FakeAudioContext();
    const sources = new InMemoryAudioSourceRepository();
    sources.set('active-source', { channels: [new Float32Array(32).fill(1)], sampleRate: 4 });
    const playback = new MultitrackPlayback({
      contextFactory: () => context as unknown as AudioContext,
    });
    playback.configure(playbackProject(), sources, { masterGain: 1 }, []);

    await expect(playback.play()).rejects.toThrow('future-source is unavailable');
    expect(context.sources).toHaveLength(0);
    await playback.close();
  });

  it('schedules the equal-power crossfade envelope for overlapping clips', async () => {
    const context = new FakeAudioContext();
    const sources = new InMemoryAudioSourceRepository();
    sources.set('a', { channels: [new Float32Array(12).fill(1)], sampleRate: 4 });
    sources.set('b', { channels: [new Float32Array(12).fill(1)], sampleRate: 4 });
    let project = addTrack(
      createAudioProject({ id: 'crossfade', name: 'Crossfade', sampleRate: 4 }),
      createAudioTrack({ id: 'track', name: 'Track' }),
    );
    project = addClip(
      project,
      'track',
      createAudioClip({ duration: 2, id: 'a', name: 'A', sourceId: 'a', start: 0 }),
    );
    project = addClip(
      project,
      'track',
      createAudioClip({ duration: 2, id: 'b', name: 'B', sourceId: 'b', start: 1 }),
    );
    const playback = new MultitrackPlayback({
      contextFactory: () => context as unknown as AudioContext,
      monitorIntervalMs: 60_000,
    });
    playback.configure(project, sources, { masterGain: 1 }, [createCrossfade(project, 'a', 'b')]);

    await playback.play();

    const curves = context.gains.flatMap((gain) => (gain.gain.curve ? [gain.gain.curve] : []));
    expect(curves).toHaveLength(2);
    expect(curves[0]?.at(-1)).toBeCloseTo(0);
    expect(curves[1]?.at(0)).toBeCloseTo(0);
    expect(curves[1]?.at(-1)).toBeCloseTo(1);
    playback.stop();
    await playback.close();
  });
});
