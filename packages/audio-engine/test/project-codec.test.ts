import { describe, expect, it } from 'vitest';

import { deserializeAudioProject, serializeAudioProject, type AudioProject } from '../src/index.js';

const project: AudioProject = {
  id: 'project-1',
  markers: [{ color: '#fff', id: 'marker-1', loop: false, name: 'Intro', time: 0.5 }],
  name: 'Session',
  sampleRate: 48_000,
  tracks: [
    {
      clips: [
        {
          duration: 2,
          fadeIn: 0.1,
          fadeOut: 0.2,
          gain: 1,
          id: 'clip-1',
          name: 'Voice',
          offset: 0,
          sourceId: 'source-1',
          start: 0,
        },
      ],
      color: '#43e4dc',
      gain: 1,
      id: 'track-1',
      muted: false,
      name: 'Voice',
      pan: 0,
      solo: false,
    },
  ],
};

describe('AudioMass project codec', () => {
  it('round-trips the versioned project domain', () => {
    expect(deserializeAudioProject(serializeAudioProject(project))).toEqual(project);
  });

  it('rejects unsupported versions and duplicate entity ids', () => {
    expect(() => deserializeAudioProject('{"format":"audiomass-project","version":2}')).toThrow(
      'Unsupported AudioMass project format or version',
    );
    const invalid: AudioProject = {
      ...project,
      tracks: project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => ({ ...clip, id: 'track-1' })),
      })),
    };
    expect(() => deserializeAudioProject(serializeAudioProject(invalid))).toThrow(
      'Duplicate project entity id',
    );
  });
});
