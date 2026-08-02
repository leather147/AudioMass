import { clipEnvelope, type AudioClip, type AudioProject } from './project.js';

export const MINIMUM_CROSSFADE_SECONDS = 0.005;

export interface AudioCrossfade {
  firstClipId: string;
  secondClipId: string;
}

export interface ClipOverlap {
  end: number;
  start: number;
}

function orderedIds(firstClipId: string, secondClipId: string): readonly [string, string] {
  return firstClipId < secondClipId ? [firstClipId, secondClipId] : [secondClipId, firstClipId];
}

export function crossfadeKey(firstClipId: string, secondClipId: string): string {
  return orderedIds(firstClipId, secondClipId).join(':');
}

function findClip(project: AudioProject, clipId: string): AudioClip | undefined {
  return project.tracks.flatMap((track) => track.clips).find((clip) => clip.id === clipId);
}

function trackIdForClip(project: AudioProject, clipId: string): string | undefined {
  return project.tracks.find((track) => track.clips.some((clip) => clip.id === clipId))?.id;
}

export function clipOverlap(
  project: AudioProject,
  first: AudioClip,
  second: AudioClip,
): ClipOverlap | null {
  if (trackIdForClip(project, first.id) !== trackIdForClip(project, second.id)) return null;
  const start = Math.max(first.start, second.start);
  const end = Math.min(first.start + first.duration, second.start + second.duration);
  return end - start > MINIMUM_CROSSFADE_SECONDS ? { end, start } : null;
}

export function createCrossfade(
  project: AudioProject,
  firstClipId: string,
  secondClipId: string,
): AudioCrossfade {
  if (firstClipId === secondClipId) throw new Error('A clip cannot crossfade with itself.');
  const first = findClip(project, firstClipId);
  const second = findClip(project, secondClipId);
  if (!first || !second) throw new Error('Both crossfade clips must exist.');
  if (!clipOverlap(project, first, second)) {
    throw new Error('Crossfade clips must overlap on the same track.');
  }
  const [orderedFirst, orderedSecond] = orderedIds(firstClipId, secondClipId);
  return { firstClipId: orderedFirst, secondClipId: orderedSecond };
}

export function normalizeCrossfades(
  project: AudioProject,
  crossfades: readonly AudioCrossfade[],
): readonly AudioCrossfade[] {
  const normalized = new Map<string, AudioCrossfade>();
  for (const crossfade of crossfades) {
    try {
      const candidate = createCrossfade(project, crossfade.firstClipId, crossfade.secondClipId);
      normalized.set(crossfadeKey(candidate.firstClipId, candidate.secondClipId), candidate);
    } catch {
      // Project mutations can remove a clip or its overlap; stale pairs are discarded.
    }
  }
  return [...normalized.values()];
}

export function toggleClipCrossfades(
  project: AudioProject,
  crossfades: readonly AudioCrossfade[],
  clipId: string,
): readonly AudioCrossfade[] {
  const clip = findClip(project, clipId);
  if (!clip) throw new Error(`Clip ${clipId} does not exist.`);
  const overlaps = project.tracks
    .flatMap((track) => track.clips)
    .filter((candidate) => candidate.id !== clip.id && clipOverlap(project, clip, candidate));
  if (overlaps.length === 0) return normalizeCrossfades(project, crossfades);

  const normalized = normalizeCrossfades(project, crossfades);
  const activeKeys = new Set(
    normalized.map((crossfade) => crossfadeKey(crossfade.firstClipId, crossfade.secondClipId)),
  );
  const overlapKeys = overlaps.map((candidate) => crossfadeKey(clip.id, candidate.id));
  const allActive = overlapKeys.every((key) => activeKeys.has(key));
  if (allActive) {
    const removed = new Set(overlapKeys);
    return normalized.filter(
      (crossfade) => !removed.has(crossfadeKey(crossfade.firstClipId, crossfade.secondClipId)),
    );
  }

  const next = [...normalized];
  for (const candidate of overlaps) {
    const key = crossfadeKey(clip.id, candidate.id);
    if (!activeKeys.has(key)) next.push(createCrossfade(project, clip.id, candidate.id));
  }
  return next;
}

export function clipMixEnvelope(
  project: AudioProject,
  clip: AudioClip,
  time: number,
  crossfades: readonly AudioCrossfade[],
): number {
  let crossfadeGain = 1;
  let matched = false;
  const activeKeys = new Set(
    crossfades.map((crossfade) => crossfadeKey(crossfade.firstClipId, crossfade.secondClipId)),
  );
  for (const other of project.tracks.flatMap((track) => track.clips)) {
    if (other.id === clip.id || !activeKeys.has(crossfadeKey(clip.id, other.id))) continue;
    const overlap = clipOverlap(project, clip, other);
    if (!overlap || time < overlap.start || time > overlap.end) continue;
    const progress = (time - overlap.start) / Math.max(0.0001, overlap.end - overlap.start);
    const first = clip.start < other.start || (clip.start === other.start && clip.id < other.id);
    crossfadeGain *= first
      ? Math.cos(progress * Math.PI * 0.5)
      : Math.sin(progress * Math.PI * 0.5);
    matched = true;
  }
  return matched ? clip.gain * crossfadeGain : clipEnvelope(clip, time);
}
