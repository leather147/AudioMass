import { TypedEventEmitter } from '../typed-event-emitter.js';
import type { PcmAudio } from '../types.js';
import { bounceProject, type BounceProjectOptions } from '../multitrack/bounce.js';
import {
  normalizeCrossfades,
  toggleClipCrossfades,
  type AudioCrossfade,
} from '../multitrack/crossfade.js';
import {
  createMixerState,
  updateMasterGain,
  updateMixerTrack,
  type MixerState,
  type MixerTrackUpdate,
} from '../multitrack/mixer.js';
import {
  MultitrackPlayback,
  type MultitrackPlaybackPort,
  type MultitrackPlaybackSnapshot,
} from '../multitrack/playback.js';
import {
  addClip,
  addTrack,
  createAudioClip,
  createAudioProject,
  createAudioTrack,
  removeClip,
  removeTrack,
  type AudioProject,
} from '../multitrack/project.js';
import {
  InMemoryAudioSourceRepository,
  type MutableAudioSourceRepository,
} from '../multitrack/source-repository.js';

export interface MultitrackSourceInput {
  audio: PcmAudio;
  clipId: string;
  color?: string;
  name: string;
  sourceId: string;
  start?: number;
  trackId: string;
}

export interface MultitrackStoredSource {
  audio: PcmAudio;
  sourceId: string;
}

export interface MultitrackSessionDocument {
  crossfades: readonly AudioCrossfade[];
  mixer: MixerState;
  project: AudioProject;
  sources: readonly MultitrackStoredSource[];
}

export interface MultitrackSessionSnapshot {
  crossfades: readonly AudioCrossfade[];
  mixer: MixerState;
  project: AudioProject;
  transport: MultitrackPlaybackSnapshot;
}

export interface MultitrackSessionEvents {
  error: Error;
  statechange: MultitrackSessionSnapshot;
}

function pcmDuration(audio: PcmAudio): number {
  return (audio.channels[0]?.length ?? 0) / audio.sampleRate;
}

/**
 * Application service for native multitrack state. It coordinates immutable
 * project mutations, owned PCM sources, transport routing, and deterministic
 * export without exposing Web Audio nodes or source arrays to React.
 */
export class MultitrackSession extends TypedEventEmitter<MultitrackSessionEvents> {
  readonly #disposers: Array<() => void> = [];
  #crossfades: readonly AudioCrossfade[] = [];
  #mixer = createMixerState();
  #project: AudioProject;
  #snapshotValue: MultitrackSessionSnapshot;

  constructor(
    project: AudioProject = createAudioProject({ id: 'project', name: 'Untitled project' }),
    private readonly playback: MultitrackPlaybackPort = new MultitrackPlayback(),
    private readonly sources: MutableAudioSourceRepository = new InMemoryAudioSourceRepository(),
  ) {
    super();
    this.#project = project;
    this.playback.configure(project, sources, this.#mixer, this.#crossfades);
    this.#snapshotValue = this.#createSnapshot();
    this.#disposers.push(
      playback.on('statechange', () => this.#publish()),
      playback.on('error', (error) => this.emit('error', error)),
    );
  }

  get snapshot(): MultitrackSessionSnapshot {
    return this.#snapshotValue;
  }

  createDocument(): MultitrackSessionDocument {
    const sourceIds = new Set(
      this.#project.tracks.flatMap((track) => track.clips.map((clip) => clip.sourceId)),
    );
    const sources = [...sourceIds].map((sourceId) => {
      const audio = this.sources.get(sourceId);
      if (!audio) throw new Error(`Audio source ${sourceId} is unavailable.`);
      return { audio, sourceId };
    });
    return {
      crossfades: this.#crossfades.map((crossfade) => ({ ...crossfade })),
      mixer: { ...this.#mixer },
      project: this.#project,
      sources,
    };
  }

  loadDocument(document: MultitrackSessionDocument): void {
    const validated = new InMemoryAudioSourceRepository();
    for (const source of document.sources) {
      if (validated.has(source.sourceId)) {
        throw new Error(`Audio source ${source.sourceId} already exists.`);
      }
      validated.set(source.sourceId, source.audio);
    }
    const sourceIds = new Set(document.sources.map((source) => source.sourceId));
    for (const sourceId of document.project.tracks.flatMap((track) =>
      track.clips.map((clip) => clip.sourceId),
    )) {
      if (!sourceIds.has(sourceId)) throw new Error(`Audio source ${sourceId} is unavailable.`);
    }
    this.playback.stop();
    this.sources.clear();
    for (const sourceId of sourceIds) this.sources.set(sourceId, validated.get(sourceId)!);
    this.#project = document.project;
    this.#mixer = createMixerState(document.mixer.masterGain);
    this.#crossfades = normalizeCrossfades(document.project, document.crossfades);
    this.#syncProject();
  }

  #createSnapshot(): MultitrackSessionSnapshot {
    return {
      crossfades: this.#crossfades,
      mixer: this.#mixer,
      project: this.#project,
      transport: this.playback.snapshot,
    };
  }

  addSource(input: MultitrackSourceInput): void {
    if (this.sources.has(input.sourceId)) {
      throw new Error(`Audio source ${input.sourceId} already exists.`);
    }
    this.playback.stop();
    this.sources.set(input.sourceId, input.audio);
    try {
      const project =
        this.#project.tracks.length === 0
          ? { ...this.#project, sampleRate: input.audio.sampleRate }
          : this.#project;
      const withTrack = addTrack(
        project,
        createAudioTrack({ color: input.color, id: input.trackId, name: input.name }),
      );
      this.#project = addClip(
        withTrack,
        input.trackId,
        createAudioClip({
          duration: pcmDuration(input.audio),
          id: input.clipId,
          name: input.name,
          sourceId: input.sourceId,
          start: input.start ?? 0,
        }),
      );
    } catch (error) {
      this.sources.delete(input.sourceId);
      throw error;
    }
    this.#syncProject();
  }

  removeClip(clipId: string): void {
    const sourceId = this.#project.tracks
      .flatMap((track) => track.clips)
      .find((clip) => clip.id === clipId)?.sourceId;
    if (!sourceId) return;
    this.playback.stop();
    this.#project = removeClip(this.#project, clipId);
    const stillUsed = this.#project.tracks.some((track) =>
      track.clips.some((clip) => clip.sourceId === sourceId),
    );
    if (!stillUsed) this.sources.delete(sourceId);
    this.#syncProject();
  }

  removeTrack(trackId: string): void {
    const track = this.#project.tracks.find((candidate) => candidate.id === trackId);
    if (!track) return;
    const sourceIds = new Set(track.clips.map((clip) => clip.sourceId));
    this.playback.stop();
    this.#project = removeTrack(this.#project, trackId);
    for (const sourceId of sourceIds) {
      const stillUsed = this.#project.tracks.some((candidate) =>
        candidate.clips.some((clip) => clip.sourceId === sourceId),
      );
      if (!stillUsed) this.sources.delete(sourceId);
    }
    this.#syncProject();
  }

  updateTrack(trackId: string, update: MixerTrackUpdate): void {
    this.#project = updateMixerTrack(this.#project, trackId, update);
    this.playback.syncMixer(this.#project, this.#mixer);
    this.#publish();
  }

  updateMasterGain(value: number): void {
    this.#mixer = updateMasterGain(this.#mixer, value);
    this.playback.syncMixer(this.#project, this.#mixer);
    this.#publish();
  }

  toggleCrossfade(clipId: string): void {
    this.playback.stop();
    this.#crossfades = toggleClipCrossfades(this.#project, this.#crossfades, clipId);
    this.#syncProject();
  }

  bounce(options: BounceProjectOptions = {}): PcmAudio | null {
    return bounceProject(this.#project, this.sources, {
      ...options,
      crossfades: options.crossfades ?? this.#crossfades,
      masterGain: options.masterGain ?? this.#mixer.masterGain,
    });
  }

  play(): Promise<void> {
    return this.playback.play();
  }

  pause(): void {
    this.playback.pause();
  }

  stop(): void {
    this.playback.stop();
  }

  seek(seconds: number): Promise<void> {
    return this.playback.seek(seconds);
  }

  async close(): Promise<void> {
    for (const dispose of this.#disposers.splice(0)) dispose();
    await this.playback.close();
    this.sources.clear();
    this.removeAllListeners();
  }

  #publish(): void {
    this.#snapshotValue = this.#createSnapshot();
    this.emit('statechange', this.#snapshotValue);
  }

  #syncProject(): void {
    this.#crossfades = normalizeCrossfades(this.#project, this.#crossfades);
    this.playback.configure(this.#project, this.sources, this.#mixer, this.#crossfades);
    this.#publish();
  }
}
