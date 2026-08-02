import { createAudioMarker, sortAudioMarkers, type AudioMarker } from './markers.js';
import {
  createAudioClip,
  createAudioTrack,
  type AudioProject,
  type AudioTrack,
} from '../multitrack/project.js';

export const AUDIO_PROJECT_FORMAT = 'audiomass-project' as const;
export const AUDIO_PROJECT_VERSION = 1 as const;

export interface SerializedAudioProject {
  format: typeof AUDIO_PROJECT_FORMAT;
  project: AudioProject;
  version: typeof AUDIO_PROJECT_VERSION;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('AudioMass project values must be objects.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, maximum = 255): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new TypeError(`${field} must be a non-empty string of at most ${maximum} characters.`);
  }
  return value;
}

function finite(value: unknown, field: string, minimum = Number.NEGATIVE_INFINITY): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new TypeError(`${field} must be a finite number greater than or equal to ${minimum}.`);
  }
  return value;
}

function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new TypeError(`${field} must be a boolean.`);
  return value;
}

function parseMarker(value: unknown, duration: number, index: number): AudioMarker {
  const marker = record(value);
  return createAudioMarker(
    {
      color: text(marker.color, `markers[${index}].color`, 32),
      loop: boolean(marker.loop, `markers[${index}].loop`),
      name: text(marker.name, `markers[${index}].name`, 160),
      time: finite(marker.time, `markers[${index}].time`, 0),
    },
    duration,
    text(marker.id, `markers[${index}].id`, 160),
    index,
  );
}

function parseTrack(value: unknown, trackIndex: number): AudioTrack {
  const input = record(value);
  const track = {
    ...createAudioTrack({
      color: text(input.color, `tracks[${trackIndex}].color`, 32),
      id: text(input.id, `tracks[${trackIndex}].id`, 160),
      name: text(input.name, `tracks[${trackIndex}].name`, 160),
    }),
    gain: finite(input.gain, `tracks[${trackIndex}].gain`, 0),
    muted: boolean(input.muted, `tracks[${trackIndex}].muted`),
    pan: Math.max(-1, Math.min(1, finite(input.pan, `tracks[${trackIndex}].pan`))),
    solo: boolean(input.solo, `tracks[${trackIndex}].solo`),
  };
  if (!Array.isArray(input.clips))
    throw new TypeError(`tracks[${trackIndex}].clips must be an array.`);
  return {
    ...track,
    clips: input.clips.map((value, clipIndex) => {
      const clip = record(value);
      return createAudioClip({
        duration: finite(clip.duration, `tracks[${trackIndex}].clips[${clipIndex}].duration`, 0),
        fadeIn: finite(clip.fadeIn, `tracks[${trackIndex}].clips[${clipIndex}].fadeIn`, 0),
        fadeOut: finite(clip.fadeOut, `tracks[${trackIndex}].clips[${clipIndex}].fadeOut`, 0),
        gain: finite(clip.gain, `tracks[${trackIndex}].clips[${clipIndex}].gain`, 0),
        id: text(clip.id, `tracks[${trackIndex}].clips[${clipIndex}].id`, 160),
        name: text(clip.name, `tracks[${trackIndex}].clips[${clipIndex}].name`, 160),
        offset: finite(clip.offset, `tracks[${trackIndex}].clips[${clipIndex}].offset`, 0),
        sourceId: text(clip.sourceId, `tracks[${trackIndex}].clips[${clipIndex}].sourceId`, 160),
        start: finite(clip.start, `tracks[${trackIndex}].clips[${clipIndex}].start`, 0),
      });
    }),
  };
}

export function parseAudioProject(value: unknown): AudioProject {
  const envelope = record(value);
  if (envelope.format !== AUDIO_PROJECT_FORMAT || envelope.version !== AUDIO_PROJECT_VERSION) {
    throw new TypeError('Unsupported AudioMass project format or version.');
  }
  const input = record(envelope.project);
  if (!Array.isArray(input.tracks) || !Array.isArray(input.markers)) {
    throw new TypeError('AudioMass projects require track and marker arrays.');
  }
  const tracks = input.tracks.map(parseTrack);
  const duration = tracks.reduce(
    (maximum, track) =>
      track.clips.reduce(
        (trackMaximum, clip) => Math.max(trackMaximum, clip.start + clip.duration),
        maximum,
      ),
    0,
  );
  const ids = new Set<string>();
  for (const id of tracks.flatMap((track) => [track.id, ...track.clips.map((clip) => clip.id)])) {
    if (ids.has(id)) throw new TypeError(`Duplicate project entity id: ${id}.`);
    ids.add(id);
  }
  return {
    id: text(input.id, 'project.id', 160),
    markers: sortAudioMarkers(
      input.markers.map((marker, index) => parseMarker(marker, duration, index)),
    ),
    name: text(input.name, 'project.name', 160),
    sampleRate: finite(input.sampleRate, 'project.sampleRate', 1),
    tracks,
  };
}

export function deserializeAudioProject(source: string): AudioProject {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new TypeError('AudioMass project is not valid JSON.', { cause: error });
  }
  return parseAudioProject(value);
}

export function serializeAudioProject(project: AudioProject): string {
  return JSON.stringify({ format: AUDIO_PROJECT_FORMAT, project, version: AUDIO_PROJECT_VERSION });
}
