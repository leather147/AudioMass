import { updateTrack, type AudioProject, type AudioTrack } from './project.js';

export interface MixerState {
  masterGain: number;
}

export interface MixerTrackUpdate {
  gain?: number;
  muted?: boolean;
  pan?: number;
  solo?: boolean;
}

export interface StereoGains {
  left: number;
  right: number;
}

export interface MixerChannelGraph {
  input: GainNode;
  level: GainNode;
  panner: StereoPannerNode | null;
  trackId: string;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function clampMixerGain(value: number): number {
  return Math.max(0, Math.min(1, finite(value, 1)));
}

export function clampPan(value: number): number {
  return Math.max(-1, Math.min(1, finite(value, 0)));
}

export function createMixerState(masterGain = 1): MixerState {
  return { masterGain: clampMixerGain(masterGain) };
}

export function updateMasterGain(state: MixerState, masterGain: number): MixerState {
  return { ...state, masterGain: clampMixerGain(masterGain) };
}

export function updateMixerTrack(
  project: AudioProject,
  trackId: string,
  update: MixerTrackUpdate,
): AudioProject {
  return updateTrack(project, trackId, {
    ...update,
    gain: update.gain === undefined ? undefined : clampMixerGain(update.gain),
    pan: update.pan === undefined ? undefined : clampPan(update.pan),
  });
}

export function isTrackAudible(project: AudioProject, track: AudioTrack): boolean {
  if (track.muted) return false;
  const hasSolo = project.tracks.some((candidate) => candidate.solo && !candidate.muted);
  return !hasSolo || track.solo;
}

export function effectiveTrackGain(project: AudioProject, track: AudioTrack): number {
  return isTrackAudible(project, track) ? Math.max(0, finite(track.gain, 1)) : 0;
}

/**
 * CPU mixdown fallback used by the compatibility runtime: the channel opposite
 * the pan direction is attenuated linearly while the near channel stays at the
 * requested level.
 */
export function linearPanGains(pan: number, gain = 1): StereoGains {
  const normalizedPan = clampPan(pan);
  const normalizedGain = Math.max(0, finite(gain, 1));
  return {
    left: normalizedGain * (normalizedPan > 0 ? 1 - normalizedPan : 1),
    right: normalizedGain * (normalizedPan < 0 ? 1 + normalizedPan : 1),
  };
}

function setParameter(parameter: AudioParam, value: number, time: number): void {
  parameter.cancelScheduledValues(time);
  parameter.setValueAtTime(value, time);
}

/**
 * Owns the Web Audio channel/master routing graph without exposing it to React.
 * Clip schedulers connect their envelope nodes to `inputFor(trackId)`.
 */
export class MultitrackMixerGraph {
  readonly master: GainNode;

  readonly #channels = new Map<string, MixerChannelGraph>();
  readonly #context: BaseAudioContext;

  constructor(context: BaseAudioContext, destination: AudioNode) {
    this.#context = context;
    this.master = context.createGain();
    this.master.connect(destination);
  }

  channel(trackId: string): MixerChannelGraph | undefined {
    return this.#channels.get(trackId);
  }

  inputFor(trackId: string): AudioNode {
    const channel = this.#channels.get(trackId);
    if (!channel) throw new Error(`Mixer channel ${trackId} does not exist.`);
    return channel.input;
  }

  sync(project: AudioProject, state: MixerState): void {
    const activeIds = new Set(project.tracks.map((track) => track.id));
    for (const [trackId, channel] of this.#channels) {
      if (activeIds.has(trackId)) continue;
      channel.input.disconnect();
      channel.panner?.disconnect();
      channel.level.disconnect();
      this.#channels.delete(trackId);
    }

    setParameter(this.master.gain, clampMixerGain(state.masterGain), this.#context.currentTime);
    for (const track of project.tracks) {
      const channel = this.#channels.get(track.id) ?? this.#createChannel(track.id);
      setParameter(
        channel.level.gain,
        effectiveTrackGain(project, track),
        this.#context.currentTime,
      );
      if (channel.panner) {
        setParameter(channel.panner.pan, clampPan(track.pan), this.#context.currentTime);
      }
    }
  }

  dispose(): void {
    for (const channel of this.#channels.values()) {
      channel.input.disconnect();
      channel.panner?.disconnect();
      channel.level.disconnect();
    }
    this.#channels.clear();
    this.master.disconnect();
  }

  #createChannel(trackId: string): MixerChannelGraph {
    const input = this.#context.createGain();
    const level = this.#context.createGain();
    const factory = (
      this.#context as BaseAudioContext & {
        createStereoPanner?: () => StereoPannerNode;
      }
    ).createStereoPanner;
    const panner = typeof factory === 'function' ? factory.call(this.#context) : null;
    if (panner) {
      input.connect(panner);
      panner.connect(level);
    } else {
      input.connect(level);
    }
    level.connect(this.master);
    const channel = { input, level, panner, trackId };
    this.#channels.set(trackId, channel);
    return channel;
  }
}
