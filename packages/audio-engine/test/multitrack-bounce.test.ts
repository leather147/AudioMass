import { describe, expect, it } from 'vitest';

import {
  addClip,
  addTrack,
  bounceProject,
  createAudioClip,
  createAudioTrack,
  createCrossfade,
  updateMixerTrack,
  type AudioProject,
  type AudioSourceRepository,
  type PcmAudio,
} from '@audio-engine/index';

const sources = new Map<string, PcmAudio>([
  ['one', { channels: [new Float32Array(12).fill(1)], sampleRate: 4 }],
  ['half', { channels: [new Float32Array(12).fill(0.5)], sampleRate: 4 }],
]);
const repository: AudioSourceRepository = {
  get: (sourceId) => sources.get(sourceId),
};

function addSourceClip(
  project: AudioProject,
  trackId: string,
  clipId: string,
  sourceId: string,
  start = 0,
): AudioProject {
  return addClip(
    project,
    trackId,
    createAudioClip({ duration: 2, id: clipId, name: clipId, sourceId, start }),
  );
}

describe('multitrack PCM bounce', () => {
  it('mixes mute/solo, master gain, and linear pan into deterministic stereo PCM', () => {
    const empty: AudioProject = {
      id: 'project-1',
      markers: [],
      name: 'Bounce',
      sampleRate: 4,
      tracks: [],
    };
    let project = addTrack(empty, createAudioTrack({ id: 'left', name: 'Left' }));
    project = addTrack(project, createAudioTrack({ id: 'right', name: 'Right' }));
    project = updateMixerTrack(project, 'left', { pan: -1 });
    project = updateMixerTrack(project, 'right', { pan: 1 });
    project = addSourceClip(project, 'left', 'clip-left', 'one');
    project = addSourceClip(project, 'right', 'clip-right', 'half');

    const output = bounceProject(project, repository, { masterGain: 0.5 });

    expect(Array.from(output?.channels[0] ?? [])).toEqual(new Array(8).fill(0.5));
    expect(Array.from(output?.channels[1] ?? [])).toEqual(new Array(8).fill(0.25));

    const soloed = updateMixerTrack(project, 'right', { solo: true });
    const soloOutput = bounceProject(soloed, repository);
    expect(Array.from(soloOutput?.channels[0] ?? [])).toEqual(new Array(8).fill(0));
    expect(Array.from(soloOutput?.channels[1] ?? [])).toEqual(new Array(8).fill(0.5));
  });

  it('applies equal-power crossfades and selection-relative output offsets', () => {
    const empty: AudioProject = {
      id: 'project-2',
      markers: [],
      name: 'Crossfade bounce',
      sampleRate: 4,
      tracks: [createAudioTrack({ id: 'track', name: 'Track' })],
    };
    let project = addSourceClip(empty, 'track', 'clip-a', 'one');
    project = addSourceClip(project, 'track', 'clip-b', 'half', 1);
    const crossfade = createCrossfade(project, 'clip-a', 'clip-b');

    const output = bounceProject(project, repository, {
      crossfades: [crossfade],
      range: { end: 2, start: 1 },
    });
    const expected = [1, Math.cos(Math.PI / 8) + Math.sin(Math.PI / 8) * 0.5, Math.SQRT1_2 * 1.5];
    const left = Array.from(output?.channels[0] ?? []);

    expect(left).toHaveLength(4);
    expect(left[0]).toBeCloseTo(expected[0]!);
    expect(left[1]).toBeCloseTo(expected[1]!);
    expect(left[2]).toBeCloseTo(expected[2]!);
    expect(left[3]).toBeCloseTo(Math.cos((3 * Math.PI) / 8) + Math.sin((3 * Math.PI) / 8) * 0.5);
  });

  it('fails loudly when a referenced source is not available', () => {
    const project = addSourceClip(
      {
        id: 'project-3',
        markers: [],
        name: 'Missing source',
        sampleRate: 4,
        tracks: [createAudioTrack({ id: 'track', name: 'Track' })],
      },
      'track',
      'clip',
      'missing',
    );
    expect(() => bounceProject(project, repository)).toThrow('Audio source missing is unavailable');
  });
});
