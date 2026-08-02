import { describe, expect, it } from 'vitest';

import {
  addClip,
  addTrack,
  clipMixEnvelope,
  createAudioClip,
  createAudioTrack,
  createCrossfade,
  normalizeCrossfades,
  toggleClipCrossfades,
  type AudioProject,
} from '@audio-engine/index';

function createProject(secondStart = 1): AudioProject {
  const empty: AudioProject = {
    id: 'project-1',
    markers: [],
    name: 'Crossfade project',
    sampleRate: 48_000,
    tracks: [],
  };
  const withTrack = addTrack(empty, createAudioTrack({ id: 'track-1', name: 'Track' }));
  return addClip(
    addClip(
      withTrack,
      'track-1',
      createAudioClip({
        duration: 2,
        id: 'clip-a',
        name: 'A',
        sourceId: 'source-a',
        start: 0,
      }),
    ),
    'track-1',
    createAudioClip({
      duration: 2,
      id: 'clip-b',
      name: 'B',
      sourceId: 'source-b',
      start: secondStart,
    }),
  );
}

describe('multitrack crossfade domain', () => {
  it('matches the legacy sine/cosine equal-power overlap curve', () => {
    const project = createProject();
    const crossfade = createCrossfade(project, 'clip-b', 'clip-a');
    const first = project.tracks[0]!.clips.find((clip) => clip.id === 'clip-a')!;
    const second = project.tracks[0]!.clips.find((clip) => clip.id === 'clip-b')!;

    expect(crossfade).toEqual({ firstClipId: 'clip-a', secondClipId: 'clip-b' });
    expect(clipMixEnvelope(project, first, 1, [crossfade])).toBeCloseTo(1);
    expect(clipMixEnvelope(project, second, 1, [crossfade])).toBeCloseTo(0);
    expect(clipMixEnvelope(project, first, 1.5, [crossfade])).toBeCloseTo(Math.SQRT1_2);
    expect(clipMixEnvelope(project, second, 1.5, [crossfade])).toBeCloseTo(Math.SQRT1_2);
    expect(clipMixEnvelope(project, first, 2, [crossfade])).toBeCloseTo(0);
    expect(clipMixEnvelope(project, second, 2, [crossfade])).toBeCloseTo(1);
  });

  it('toggles every valid overlap and removes stale pairs after mutations', () => {
    const project = createProject();
    const enabled = toggleClipCrossfades(project, [], 'clip-a');
    expect(enabled).toHaveLength(1);
    expect(toggleClipCrossfades(project, enabled, 'clip-a')).toEqual([]);
    expect(
      normalizeCrossfades(
        { ...project, tracks: project.tracks.map((track) => ({ ...track, clips: [] })) },
        enabled,
      ),
    ).toEqual([]);
  });

  it('rejects overlaps at or below the established five millisecond threshold', () => {
    expect(() => createCrossfade(createProject(1.995), 'clip-a', 'clip-b')).toThrow(
      'must overlap on the same track',
    );
  });
});
