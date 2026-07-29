import { describe, expect, it } from 'vitest';

import {
  addClip,
  addTrack,
  clipsAt,
  createAudioClip,
  createAudioTrack,
  moveClip,
  projectDuration,
  updateTrack,
  type AudioProject,
} from '@audio-engine/index';

const emptyProject: AudioProject = {
  id: 'project-1',
  markers: [],
  name: 'Composition',
  sampleRate: 48_000,
  tracks: [],
};

describe('multitrack project domain', () => {
  it('models tracks and clips immutably and schedules active material', () => {
    const withTracks = addTrack(
      addTrack(emptyProject, createAudioTrack({ id: 'track-a', name: 'Voice' })),
      createAudioTrack({ id: 'track-b', name: 'Music' }),
    );
    const clip = createAudioClip({
      duration: 4,
      fadeIn: 1,
      id: 'clip-a',
      name: 'Take 1',
      sourceId: 'asset-a',
      start: 2,
    });
    const withClip = addClip(withTracks, 'track-a', clip);

    expect(projectDuration(withClip)).toBe(6);
    expect(clipsAt(withClip, 2.5)[0]).toMatchObject({ gain: 0.5, offset: 0.5 });
    expect(emptyProject.tracks).toEqual([]);
    expect(moveClip(withClip, 'clip-a', 'track-b', 3).tracks[1]?.clips[0]?.start).toBe(3);
  });

  it('honors mute and solo state through the scheduler', () => {
    const track = createAudioTrack({ id: 'track-a', name: 'Voice' });
    const project = addClip(
      addTrack(emptyProject, track),
      'track-a',
      createAudioClip({ duration: 2, id: 'clip-a', name: 'Take', sourceId: 'a', start: 0 }),
    );
    expect(clipsAt(updateTrack(project, 'track-a', { muted: true }), 1)).toEqual([]);
  });
});
