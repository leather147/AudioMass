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

export interface ScheduledPlaybackClip extends ScheduledClip {
  delay: number;
  duration: number;
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

/**
 * Produces every audible clip that has not ended at `position`. `delay` is
 * relative to transport start, while `offset` is relative to the source PCM.
 */
export function scheduleProject(
  project: AudioProject,
  position: number,
): readonly ScheduledPlaybackClip[] {
  const start = Math.max(0, Number.isFinite(position) ? position : 0);
  const scheduled: ScheduledPlaybackClip[] = [];
  for (const track of activeTracks(project)) {
    for (const clip of track.clips) {
      const clipEnd = clip.start + clip.duration;
      if (clipEnd <= start) continue;
      const timelineStart = Math.max(start, clip.start);
      scheduled.push({
        clip,
        delay: timelineStart - start,
        duration: clipEnd - timelineStart,
        gain: track.gain * clipEnvelope(clip, timelineStart),
        offset: clip.offset + timelineStart - clip.start,
        track,
      });
    }
  }
  return scheduled.sort(
    (left, right) => left.delay - right.delay || left.clip.id.localeCompare(right.clip.id),
  );
}
