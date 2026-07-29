import {
  activeTracks,
  clipEnvelope,
  type AudioClip,
  type AudioProject,
  type AudioTrack,
} from './project.js';

export interface ScheduledClip {
  clip: AudioClip;
  gain: number;
  offset: number;
  track: AudioTrack;
}

export function clipsAt(project: AudioProject, position: number): readonly ScheduledClip[] {
  const scheduled: ScheduledClip[] = [];
  for (const track of activeTracks(project)) {
    for (const clip of track.clips) {
      if (position < clip.start || position >= clip.start + clip.duration) continue;
      scheduled.push({
        clip,
        gain: track.gain * clipEnvelope(clip, position),
        offset: clip.offset + position - clip.start,
        track,
      });
    }
  }
  return scheduled;
}
