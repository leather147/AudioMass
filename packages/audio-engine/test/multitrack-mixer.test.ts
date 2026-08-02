import { describe, expect, it } from 'vitest';

import {
  createAudioTrack,
  createMixerState,
  effectiveTrackGain,
  linearPanGains,
  MultitrackMixerGraph,
  updateMasterGain,
  updateMixerTrack,
  type AudioProject,
} from '@audio-engine/index';

const project: AudioProject = {
  id: 'project-1',
  markers: [],
  name: 'Mixer project',
  sampleRate: 48_000,
  tracks: [
    createAudioTrack({ id: 'voice', name: 'Voice' }),
    createAudioTrack({ id: 'music', name: 'Music' }),
  ],
};

class FakeAudioParam {
  value = 0;

  cancelScheduledValues(): void {}

  setValueAtTime(value: number): void {
    this.value = value;
  }
}

class FakeAudioNode {
  readonly connections: FakeAudioNode[] = [];

  connect(destination: FakeAudioNode): FakeAudioNode {
    this.connections.push(destination);
    return destination;
  }

  disconnect(): void {
    this.connections.length = 0;
  }
}

class FakeGainNode extends FakeAudioNode {
  readonly gain = new FakeAudioParam();
}

class FakeStereoPannerNode extends FakeAudioNode {
  readonly pan = new FakeAudioParam();
}

class FakeAudioContext {
  readonly currentTime = 4;

  createGain(): FakeGainNode {
    return new FakeGainNode();
  }

  createStereoPanner(): FakeStereoPannerNode {
    return new FakeStereoPannerNode();
  }
}

describe('multitrack mixer domain', () => {
  it('clamps interactive channel state and applies mute/solo audibility', () => {
    const adjusted = updateMixerTrack(
      updateMixerTrack(project, 'voice', { gain: 2, pan: -2 }),
      'music',
      { solo: true },
    );
    expect(adjusted.tracks[0]).toMatchObject({ gain: 1, pan: -1 });
    expect(effectiveTrackGain(adjusted, adjusted.tracks[0]!)).toBe(0);
    expect(effectiveTrackGain(adjusted, adjusted.tracks[1]!)).toBe(1);
    expect(updateMasterGain(createMixerState(), -1)).toEqual({ masterGain: 0 });
  });

  it('preserves the CPU fallback linear pan law', () => {
    expect(linearPanGains(-1, 0.75)).toEqual({ left: 0.75, right: 0 });
    expect(linearPanGains(0, 0.75)).toEqual({ left: 0.75, right: 0.75 });
    expect(linearPanGains(0.5, 0.75)).toEqual({ left: 0.375, right: 0.75 });
  });

  it('owns and synchronizes a disposable Web Audio routing graph', () => {
    const context = new FakeAudioContext();
    const destination = new FakeAudioNode();
    const graph = new MultitrackMixerGraph(
      context as unknown as BaseAudioContext,
      destination as unknown as AudioNode,
    );
    const adjusted = updateMixerTrack(project, 'music', { muted: true, pan: 0.5 });

    graph.sync(adjusted, createMixerState(0.6));

    expect((graph.master.gain as unknown as FakeAudioParam).value).toBe(0.6);
    expect((graph.channel('voice')?.level.gain as unknown as FakeAudioParam).value).toBe(1);
    expect((graph.channel('music')?.level.gain as unknown as FakeAudioParam).value).toBe(0);
    expect((graph.channel('music')?.panner?.pan as unknown as FakeAudioParam).value).toBe(0.5);
    expect(graph.inputFor('voice')).toBe(graph.channel('voice')?.input);

    graph.sync({ ...adjusted, tracks: adjusted.tracks.slice(0, 1) }, createMixerState());
    expect(graph.channel('music')).toBeUndefined();
    graph.dispose();
    expect(destination.connections).toEqual([]);
  });
});
