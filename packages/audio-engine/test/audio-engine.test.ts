import { describe, expect, it } from 'vitest';

import { AudioEngine } from '../src/index.js';

class FakeAudioBuffer {
  public readonly channels: Float32Array[];
  public readonly duration: number;

  public constructor(
    public readonly numberOfChannels: number,
    public readonly length: number,
    public readonly sampleRate: number,
  ) {
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
    this.duration = length / sampleRate;
  }

  public copyToChannel(source: Float32Array, channel: number) {
    this.channels[channel]?.set(source);
  }

  public getChannelData(channel: number) {
    return this.channels[channel]!;
  }
}

class FakeNode {
  public connect() {
    return this;
  }

  public disconnect() {}
}

class FakeSource extends FakeNode {
  public buffer: AudioBuffer | null = null;
  public onended: (() => void) | null = null;
  public offset = 0;
  public stopped = false;

  public start(_when: number, offset = 0) {
    this.offset = offset;
  }

  public stop() {
    this.stopped = true;
  }
}

class FakeAudioContext {
  public currentTime = 0;
  public readonly destination = new FakeNode();
  public readonly sampleRate = 4;
  public state: AudioContextState = 'running';
  public readonly sources: FakeSource[] = [];
  public readonly gain = {
    connect: () => this.destination,
    gain: {
      setTargetAtTime: (value: number) => {
        this.gain.gain.value = value;
      },
      value: 1,
    },
  };

  public async close() {
    this.state = 'closed';
  }

  public createAnalyser() {
    return new FakeNode();
  }

  public createBuffer(channels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer(channels, length, sampleRate);
  }

  public createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  public createGain() {
    return this.gain;
  }

  public async resume() {}
}

describe('AudioEngine playback graph', () => {
  it('loads owned PCM and coordinates play, position, pause, seek, volume, and close', async () => {
    const context = new FakeAudioContext();
    const source = Float32Array.from([0, 0.5, -0.5, 0]);
    const engine = new AudioEngine({ contextFactory: () => context as unknown as AudioContext });

    expect(engine.loadPcm({ channels: [source], sampleRate: 4 })).toMatchObject({
      duration: 1,
      sampleRate: 4,
      state: 'ready',
    });
    source[1] = 1;
    expect(Array.from(engine.toPcm().channels[0]!)).toEqual([0, 0.5, -0.5, 0]);

    engine.setVolume(0.4);
    expect(context.gain.gain.value).toBe(0.4);
    await engine.play();
    expect(context.sources[0]?.offset).toBe(0);
    context.currentTime = 0.25;
    expect(engine.position).toBe(0.25);

    engine.pause();
    expect(engine.snapshot).toMatchObject({ position: 0.25, state: 'paused' });
    await engine.seek(0.75);
    await engine.play();
    expect(context.sources[1]?.offset).toBe(0.75);
    context.sources[1]?.onended?.();
    expect(engine.snapshot).toMatchObject({ position: 0, state: 'ready' });

    await engine.close();
    expect(context.state).toBe('closed');
    expect(engine.state).toBe('closed');
  });
});
