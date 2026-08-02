import type { AudioMarker } from '../domain/markers.js';

export interface AudioClip {
  duration: number;
  fadeIn: number;
  fadeOut: number;
  gain: number;
  id: string;
  name: string;
  offset: number;
  sourceId: string;
  start: number;
}

export interface AudioTrack {
  clips: readonly AudioClip[];
  color: string;
  gain: number;
  id: string;
  muted: boolean;
  name: string;
  pan: number;
  solo: boolean;
}

export interface AudioProject {
  id: string;
  markers: readonly AudioMarker[];
  name: string;
  sampleRate: number;
  tracks: readonly AudioTrack[];
}

export interface CreateAudioClip {
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
  gain?: number;
  id: string;
  name: string;
  offset?: number;
  sourceId: string;
  start: number;
}

export interface CreateAudioTrack {
  color?: string;
  id: string;
  name: string;
}

export interface CreateAudioProject {
  id: string;
  name: string;
  sampleRate?: number;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function createAudioProject(input: CreateAudioProject): AudioProject {
  return {
    id: input.id,
    markers: [],
    name: input.name.trim() || 'Untitled project',
    sampleRate: Math.max(1, Math.floor(finite(input.sampleRate ?? 48_000, 48_000))),
    tracks: [],
  };
}

export function createAudioClip(input: CreateAudioClip): AudioClip {
  const duration = Math.max(0, finite(input.duration, 0));
  const fadeIn = Math.min(duration, Math.max(0, finite(input.fadeIn ?? 0, 0)));
  const fadeOut = Math.min(duration, Math.max(0, finite(input.fadeOut ?? 0, 0)));
  return {
    duration,
    fadeIn,
    fadeOut,
    gain: Math.max(0, finite(input.gain ?? 1, 1)),
    id: input.id,
    name: input.name.trim() || 'Untitled clip',
    offset: Math.max(0, finite(input.offset ?? 0, 0)),
    sourceId: input.sourceId,
    start: Math.max(0, finite(input.start, 0)),
  };
}

export function createAudioTrack(input: CreateAudioTrack): AudioTrack {
  return {
    clips: [],
    color: input.color ?? '#43e4dc',
    gain: 1,
    id: input.id,
    muted: false,
    name: input.name.trim() || 'Untitled track',
    pan: 0,
    solo: false,
  };
}

export function addTrack(project: AudioProject, track: AudioTrack): AudioProject {
  if (project.tracks.some((candidate) => candidate.id === track.id)) {
    throw new Error(`Track ${track.id} already exists.`);
  }
  return { ...project, tracks: [...project.tracks, track] };
}

export function updateTrack(
  project: AudioProject,
  trackId: string,
  update: Partial<Omit<AudioTrack, 'clips' | 'id'>>,
): AudioProject {
  return {
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            ...update,
            gain: Math.max(0, finite(update.gain ?? track.gain, track.gain)),
            pan: Math.max(-1, Math.min(1, finite(update.pan ?? track.pan, track.pan))),
          }
        : track,
    ),
  };
}

export function addClip(project: AudioProject, trackId: string, clip: AudioClip): AudioProject {
  if (
    project.tracks.flatMap((track) => track.clips).some((candidate) => candidate.id === clip.id)
  ) {
    throw new Error(`Clip ${clip.id} already exists.`);
  }
  let found = false;
  const tracks = project.tracks.map((track) => {
    if (track.id !== trackId) return track;
    found = true;
    return {
      ...track,
      clips: [...track.clips, clip].sort(
        (left, right) => left.start - right.start || left.id.localeCompare(right.id),
      ),
    };
  });
  if (!found) throw new Error(`Track ${trackId} does not exist.`);
  return { ...project, tracks };
}

export function updateClip(
  project: AudioProject,
  clipId: string,
  update: Partial<Omit<AudioClip, 'id' | 'sourceId'>>,
): AudioProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips
        .map((clip) => (clip.id === clipId ? createAudioClip({ ...clip, ...update }) : clip))
        .sort((left, right) => left.start - right.start || left.id.localeCompare(right.id)),
    })),
  };
}

export function moveClip(
  project: AudioProject,
  clipId: string,
  destinationTrackId: string,
  start: number,
): AudioProject {
  const clip = project.tracks.flatMap((track) => track.clips).find((item) => item.id === clipId);
  if (!clip) throw new Error(`Clip ${clipId} does not exist.`);
  const withoutClip: AudioProject = {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((item) => item.id !== clipId),
    })),
  };
  return addClip(withoutClip, destinationTrackId, { ...clip, start: Math.max(0, start) });
}

export function removeClip(project: AudioProject, clipId: string): AudioProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => clip.id !== clipId),
    })),
  };
}

export function removeTrack(project: AudioProject, trackId: string): AudioProject {
  return { ...project, tracks: project.tracks.filter((track) => track.id !== trackId) };
}

export function projectDuration(project: AudioProject): number {
  return project.tracks.reduce(
    (maximum, track) =>
      track.clips.reduce(
        (trackMaximum, clip) => Math.max(trackMaximum, clip.start + clip.duration),
        maximum,
      ),
    0,
  );
}

export function activeTracks(project: AudioProject): readonly AudioTrack[] {
  const hasSolo = project.tracks.some((track) => track.solo && !track.muted);
  return project.tracks.filter((track) => !track.muted && (!hasSolo || track.solo));
}

export function clipEnvelope(clip: AudioClip, time: number): number {
  const local = time - clip.start;
  if (local < 0 || local > clip.duration) return 0;
  const fadeIn = clip.fadeIn > 0 ? Math.min(1, local / clip.fadeIn) : 1;
  const remaining = clip.duration - local;
  const fadeOut = clip.fadeOut > 0 ? Math.min(1, remaining / clip.fadeOut) : 1;
  return clip.gain * Math.min(fadeIn, fadeOut);
}
