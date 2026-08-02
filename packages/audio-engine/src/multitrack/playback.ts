import { TypedEventEmitter } from '../typed-event-emitter.js';
import type { AudioEngineState, PcmAudio } from '../types.js';
import type { AudioSourceRepository } from './bounce.js';
import { clipMixEnvelope, type AudioCrossfade } from './crossfade.js';
import { MultitrackMixerGraph, type MixerState } from './mixer.js';
import { projectDuration, type AudioProject } from './project.js';
import { scheduleProject } from './scheduler.js';

export interface MultitrackPlaybackSnapshot {
  duration: number;
  position: number;
  sampleRate: number | null;
  state: AudioEngineState;
}

export interface MultitrackPlaybackEvents {
  ended: MultitrackPlaybackSnapshot;
  error: Error;
  statechange: MultitrackPlaybackSnapshot;
}

export interface MultitrackPlaybackPort {
  readonly snapshot: MultitrackPlaybackSnapshot;
  close(): Promise<void>;
  configure(
    project: AudioProject,
    sources: AudioSourceRepository,
    mixer: MixerState,
    crossfades: readonly AudioCrossfade[],
  ): void;
  on<Name extends keyof MultitrackPlaybackEvents>(
    name: Name,
    listener: (payload: MultitrackPlaybackEvents[Name]) => void,
  ): () => void;
  pause(): void;
  play(): Promise<void>;
  seek(seconds: number): Promise<void>;
  stop(): void;
  syncMixer(project: AudioProject, mixer: MixerState): void;
}

export interface MultitrackPlaybackOptions {
  contextFactory?: () => AudioContext;
  monitorIntervalMs?: number;
}

type BrowserAudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

interface ActiveSource {
  envelope: GainNode;
  source: AudioBufferSourceNode;
}

function audioDuration(audio: PcmAudio): number {
  return (audio.channels[0]?.length ?? 0) / audio.sampleRate;
}

function copyToBuffer(context: BaseAudioContext, audio: PcmAudio): AudioBuffer {
  const frameCount = audio.channels[0]?.length ?? 0;
  const buffer = context.createBuffer(audio.channels.length, frameCount, audio.sampleRate);
  for (let channel = 0; channel < audio.channels.length; channel += 1) {
    const data = audio.channels[channel];
    if (data) buffer.copyToChannel(Float32Array.from(data), channel);
  }
  return buffer;
}

function envelopeCurve(
  project: AudioProject,
  clip: AudioProject['tracks'][number]['clips'][number],
  timelineStart: number,
  duration: number,
  crossfades: readonly AudioCrossfade[],
): Float32Array {
  const sampleCount = Math.max(2, Math.min(256, Math.ceil(duration * 60) + 1));
  return Float32Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1);
    return clipMixEnvelope(project, clip, timelineStart + duration * progress, crossfades);
  });
}

/**
 * Web Audio transport for the multitrack application boundary. The adapter
 * schedules source nodes and owns their complete lifecycle; consumers only see
 * transport snapshots and typed commands.
 */
export class MultitrackPlayback extends TypedEventEmitter<MultitrackPlaybackEvents> {
  readonly #active = new Set<ActiveSource>();
  readonly #options: MultitrackPlaybackOptions;
  #context: AudioContext | null = null;
  #crossfades: readonly AudioCrossfade[] = [];
  #graph: MultitrackMixerGraph | null = null;
  #mixer: MixerState = { masterGain: 1 };
  #monitor: ReturnType<typeof setInterval> | null = null;
  #position = 0;
  #project: AudioProject | null = null;
  #sources: AudioSourceRepository | null = null;
  #startedAt = 0;
  #state: AudioEngineState = 'idle';

  constructor(options: MultitrackPlaybackOptions = {}) {
    super();
    this.#options = options;
  }

  get snapshot(): MultitrackPlaybackSnapshot {
    const duration = this.#project ? projectDuration(this.#project) : 0;
    const position =
      this.#state === 'playing' && this.#context
        ? Math.min(duration, Math.max(0, this.#context.currentTime - this.#startedAt))
        : Math.min(duration, this.#position);
    return {
      duration,
      position,
      sampleRate: this.#project?.sampleRate ?? this.#context?.sampleRate ?? null,
      state: this.#state,
    };
  }

  configure(
    project: AudioProject,
    sources: AudioSourceRepository,
    mixer: MixerState,
    crossfades: readonly AudioCrossfade[],
  ): void {
    this.#assertOpen();
    this.#project = project;
    this.#sources = sources;
    this.#mixer = mixer;
    this.#crossfades = crossfades;
    this.#position = Math.min(this.#position, projectDuration(project));
    this.#graph?.sync(project, mixer);
    if (this.#state !== 'playing' && this.#state !== 'paused') {
      this.#setState(projectDuration(project) > 0 ? 'ready' : 'idle');
    } else {
      this.#publish();
    }
  }

  syncMixer(project: AudioProject, mixer: MixerState): void {
    this.#assertOpen();
    this.#project = project;
    this.#mixer = mixer;
    this.#graph?.sync(project, mixer);
    this.#publish();
  }

  async play(): Promise<void> {
    this.#assertOpen();
    if (this.#state === 'playing') return;
    const project = this.#requireProject();
    const sources = this.#requireSources();
    const duration = projectDuration(project);
    if (duration <= 0) throw new Error('Add an audio clip before playback.');
    if (this.#position >= duration) this.#position = 0;

    const context = this.#ensureContext();
    await context.resume();
    this.#graph?.sync(project, this.#mixer);
    this.#disconnectSources();

    try {
      const scheduledSources = scheduleProject(project, this.#position).map((scheduled) => {
        const audio = sources.get(scheduled.clip.sourceId);
        if (!audio) {
          throw new Error(`Audio source ${scheduled.clip.sourceId} is unavailable.`);
        }
        return { audio, scheduled };
      });
      for (const { audio, scheduled } of scheduledSources) {
        const available = audioDuration(audio) - scheduled.offset;
        const scheduledDuration = Math.min(scheduled.duration, available);
        if (scheduledDuration <= 0) continue;

        const source = context.createBufferSource();
        const envelope = context.createGain();
        source.buffer = copyToBuffer(context, audio);
        source.connect(envelope);
        envelope.connect(this.#graph!.inputFor(scheduled.track.id));
        const when = context.currentTime + scheduled.delay;
        const timelineStart = this.#position + scheduled.delay;
        envelope.gain.setValueCurveAtTime(
          envelopeCurve(
            project,
            scheduled.clip,
            timelineStart,
            scheduledDuration,
            this.#crossfades,
          ),
          when,
          scheduledDuration,
        );
        const active = { envelope, source };
        this.#active.add(active);
        source.onended = () => this.#sourceEnded(active);
        source.start(when, scheduled.offset, scheduledDuration);
      }
    } catch (error) {
      this.#disconnectSources();
      const wrapped = error instanceof Error ? error : new Error('Multitrack playback failed.');
      this.emit('error', wrapped);
      throw wrapped;
    }

    if (this.#active.size === 0) throw new Error('No playable multitrack sources are available.');
    this.#startedAt = context.currentTime - this.#position;
    this.#setState('playing');
    this.#startMonitoring();
  }

  pause(): void {
    if (this.#state !== 'playing') return;
    this.#position = this.snapshot.position;
    this.#disconnectSources();
    this.#stopMonitoring();
    this.#setState('paused');
  }

  stop(): void {
    this.#assertOpen();
    this.#disconnectSources();
    this.#stopMonitoring();
    this.#position = 0;
    this.#setState(this.#project && projectDuration(this.#project) > 0 ? 'ready' : 'idle');
  }

  async seek(seconds: number): Promise<void> {
    this.#assertOpen();
    const project = this.#requireProject();
    const wasPlaying = this.#state === 'playing';
    this.#position = Math.max(0, Math.min(projectDuration(project), seconds));
    this.#disconnectSources();
    this.#stopMonitoring();
    if (wasPlaying) await this.play();
    else this.#publish();
  }

  async close(): Promise<void> {
    if (this.#state === 'closed') return;
    this.#disconnectSources();
    this.#stopMonitoring();
    this.#graph?.dispose();
    this.#graph = null;
    const context = this.#context;
    this.#context = null;
    if (context && context.state !== 'closed') await context.close();
    this.#project = null;
    this.#sources = null;
    this.#setState('closed');
    this.removeAllListeners();
  }

  #assertOpen(): void {
    if (this.#state === 'closed') throw new Error('Multitrack playback is closed.');
  }

  #disconnectSources(): void {
    for (const active of this.#active) {
      active.source.onended = null;
      try {
        active.source.stop();
      } catch {
        // A scheduled source may already have ended before transport cleanup.
      }
      active.source.disconnect();
      active.envelope.disconnect();
    }
    this.#active.clear();
  }

  #ensureContext(): AudioContext {
    if (this.#context) return this.#context;
    const browser = globalThis as typeof globalThis & {
      AudioContext?: BrowserAudioContextConstructor;
      webkitAudioContext?: BrowserAudioContextConstructor;
    };
    const Context = browser.AudioContext ?? browser.webkitAudioContext;
    const context =
      this.#options.contextFactory?.() ??
      (Context ? new Context({ latencyHint: 'interactive' }) : null);
    if (!context) throw new Error('Web Audio API is unavailable in this environment.');
    this.#context = context;
    this.#graph = new MultitrackMixerGraph(context, context.destination);
    return context;
  }

  #publish(): void {
    this.emit('statechange', this.snapshot);
  }

  #requireProject(): AudioProject {
    if (!this.#project) throw new Error('Load a multitrack project before playback.');
    return this.#project;
  }

  #requireSources(): AudioSourceRepository {
    if (!this.#sources) throw new Error('Load multitrack audio sources before playback.');
    return this.#sources;
  }

  #setState(state: AudioEngineState): void {
    this.#state = state;
    this.#publish();
  }

  #sourceEnded(active: ActiveSource): void {
    if (!this.#active.delete(active)) return;
    active.source.disconnect();
    active.envelope.disconnect();
    if (this.#active.size > 0 || this.#state !== 'playing') return;
    this.#position = 0;
    this.#stopMonitoring();
    this.#setState('ready');
    this.emit('ended', this.snapshot);
  }

  #startMonitoring(): void {
    this.#stopMonitoring();
    this.#monitor = setInterval(
      () => this.#publish(),
      this.#options.monitorIntervalMs ?? 1000 / 30,
    );
  }

  #stopMonitoring(): void {
    if (this.#monitor === null) return;
    clearInterval(this.#monitor);
    this.#monitor = null;
  }
}
