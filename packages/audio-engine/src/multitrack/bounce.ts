import type { PcmAudio } from '../types.js';
import { clipMixEnvelope, type AudioCrossfade } from './crossfade.js';
import { effectiveTrackGain, linearPanGains } from './mixer.js';
import { projectDuration, type AudioProject } from './project.js';

export interface AudioSourceRepository {
  get(sourceId: string): PcmAudio | undefined;
}

export interface BounceRange {
  end: number;
  start: number;
}

export interface BounceProjectOptions {
  crossfades?: readonly AudioCrossfade[];
  masterGain?: number;
  range?: BounceRange;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function sampleAt(source: PcmAudio, channel: number, time: number): number {
  const data = source.channels[Math.min(channel, source.channels.length - 1)];
  if (!data || time < 0) return 0;
  const position = time * source.sampleRate;
  const index = Math.floor(position);
  if (index < 0 || index >= data.length) return 0;
  const first = data[index] ?? 0;
  const second = data[index + 1] ?? first;
  return first + (second - first) * (position - index);
}

/**
 * Deterministic stereo CPU mixdown. This is the browser-independent fallback
 * for export and for environments without OfflineAudioContext.
 */
export function bounceProject(
  project: AudioProject,
  sources: AudioSourceRepository,
  options: BounceProjectOptions = {},
): PcmAudio | null {
  if (!project.tracks.some((track) => track.clips.length > 0)) return null;
  const start = Math.max(0, finite(options.range?.start ?? 0, 0));
  const end = Math.max(start, finite(options.range?.end ?? projectDuration(project), start));
  if (end <= start) return null;

  const sampleRate = Math.max(1, Math.floor(finite(project.sampleRate, 48_000)));
  const frameCount = Math.max(1, Math.floor((end - start) * sampleRate));
  const left = new Float32Array(frameCount);
  const right = new Float32Array(frameCount);
  const masterGain = Math.max(0, finite(options.masterGain ?? 1, 1));
  const crossfades = options.crossfades ?? [];

  for (const track of project.tracks) {
    const trackGain = effectiveTrackGain(project, track);
    if (trackGain <= 0) continue;
    const stereo = linearPanGains(track.pan, trackGain);
    for (const clip of track.clips) {
      const clipStart = Math.max(start, clip.start);
      const clipEnd = Math.min(end, clip.start + clip.duration);
      if (clipEnd <= clipStart) continue;
      const source = sources.get(clip.sourceId);
      if (!source) throw new Error(`Audio source ${clip.sourceId} is unavailable.`);
      const outputOffset = Math.floor((clipStart - start) * sampleRate);
      const length = Math.min(
        frameCount - outputOffset,
        Math.floor((clipEnd - clipStart) * sampleRate),
      );
      for (let frame = 0; frame < length; frame += 1) {
        const timelineTime = clipStart + frame / sampleRate;
        const sourceTime = clip.offset + timelineTime - clip.start;
        const envelope = clipMixEnvelope(project, clip, timelineTime, crossfades) * masterGain;
        const outputIndex = outputOffset + frame;
        left[outputIndex] =
          left[outputIndex]! + sampleAt(source, 0, sourceTime) * stereo.left * envelope;
        right[outputIndex] =
          right[outputIndex]! +
          sampleAt(source, source.channels.length > 1 ? 1 : 0, sourceTime) *
            stereo.right *
            envelope;
      }
    }
  }

  return { channels: [left, right], sampleRate };
}
