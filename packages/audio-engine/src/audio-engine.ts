import { AudioWorkletRegistry } from './audio-worklet-registry.js';
import { assertValidPcm } from './dsp/pcm.js';
import { AudioEngineError } from './errors.js';
import { TypedEventEmitter } from './typed-event-emitter.js';
import type {
  AudioEngineEvents,
  AudioEngineOptions,
  AudioEngineSnapshot,
  AudioEngineState,
  PcmAudio,
} from './types.js';

type BrowserAudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

export class AudioEngine extends TypedEventEmitter<AudioEngineEvents> {
  private analyserNode: AnalyserNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private monitorHandle: ReturnType<typeof setInterval> | null = null;
  private readonly options: AudioEngineOptions;
  private positionSeconds = 0;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private stateValue: AudioEngineState = 'idle';
  private volumeValue = 1;
  private worklets: AudioWorkletRegistry | null = null;

  constructor(options: AudioEngineOptions = {}) {
    super();
    this.options = options;
  }

  get state(): AudioEngineState {
    return this.stateValue;
  }

  get duration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  get position(): number {
    if (this.stateValue !== 'playing' || !this.context) return this.positionSeconds;
    return Math.min(this.duration, Math.max(0, this.context.currentTime - this.startedAt));
  }

  get volume(): number {
    return this.volumeValue;
  }

  get snapshot(): AudioEngineSnapshot {
    return {
      duration: this.duration,
      position: this.position,
      sampleRate: this.audioBuffer?.sampleRate ?? this.context?.sampleRate ?? null,
      state: this.stateValue,
      volume: this.volumeValue,
    };
  }

  async decode(data: ArrayBuffer): Promise<AudioBuffer> {
    const context = this.ensureContext();
    try {
      return await context.decodeAudioData(data.slice(0));
    } catch (error) {
      const wrapped = new AudioEngineError('AUDIO_DECODE_FAILED', 'Audio decoding failed.', {
        cause: error,
      });
      this.emit('error', wrapped);
      throw wrapped;
    }
  }

  async load(input: ArrayBuffer | AudioBuffer): Promise<AudioEngineSnapshot> {
    this.assertOpen();
    const buffer = input instanceof ArrayBuffer ? await this.decode(input) : input;
    this.disconnectSource();
    this.audioBuffer = buffer;
    this.positionSeconds = 0;
    this.setState('ready');
    const snapshot = this.snapshot;
    this.emit('loaded', snapshot);
    return snapshot;
  }

  loadPcm(audio: PcmAudio): AudioEngineSnapshot {
    this.assertOpen();
    assertValidPcm(audio);
    const context = this.ensureContext();
    const frameCount = audio.channels[0]?.length ?? 0;
    const buffer = context.createBuffer(audio.channels.length, frameCount, audio.sampleRate);
    for (let channel = 0; channel < audio.channels.length; channel += 1) {
      const source = audio.channels[channel];
      if (source) buffer.copyToChannel(Float32Array.from(source), channel);
    }
    this.disconnectSource();
    this.audioBuffer = buffer;
    this.positionSeconds = 0;
    this.setState('ready');
    const snapshot = this.snapshot;
    this.emit('loaded', snapshot);
    return snapshot;
  }

  toPcm(): PcmAudio {
    const buffer = this.requireBuffer();
    return {
      channels: Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
        buffer.getChannelData(channel).slice(),
      ),
      sampleRate: buffer.sampleRate,
    };
  }

  async play(): Promise<void> {
    this.assertOpen();
    const context = this.ensureContext();
    const buffer = this.requireBuffer();
    if (this.stateValue === 'playing') return;
    if (this.positionSeconds >= buffer.duration) this.positionSeconds = 0;
    await context.resume();
    this.startSource(buffer);
    this.setState('playing');
    this.startMonitoring();
  }

  pause(): void {
    if (this.stateValue !== 'playing') return;
    this.positionSeconds = this.position;
    this.disconnectSource();
    this.stopMonitoring();
    this.setState('paused');
    this.emit('position', this.snapshot);
  }

  stop(): void {
    this.assertOpen();
    this.disconnectSource();
    this.stopMonitoring();
    this.positionSeconds = 0;
    this.setState(this.audioBuffer ? 'ready' : 'idle');
    this.emit('position', this.snapshot);
  }

  async seek(seconds: number): Promise<void> {
    this.assertOpen();
    const buffer = this.requireBuffer();
    const wasPlaying = this.stateValue === 'playing';
    this.positionSeconds = Math.max(0, Math.min(buffer.duration, seconds));
    if (wasPlaying) {
      this.disconnectSource();
      if (this.positionSeconds >= buffer.duration) {
        this.positionSeconds = 0;
        this.stopMonitoring();
        this.setState('ready');
      } else {
        this.startSource(buffer);
      }
    }
    this.emit('position', this.snapshot);
  }

  setVolume(volume: number): void {
    this.assertOpen();
    if (!Number.isFinite(volume)) {
      throw new AudioEngineError('INVALID_AUDIO_DATA', 'Volume must be a finite number.');
    }
    this.volumeValue = Math.max(0, volume);
    const context = this.ensureContext();
    this.gainNode?.gain.setTargetAtTime(this.volumeValue, context.currentTime, 0.01);
    this.emit('volumechange', this.snapshot);
  }

  getAnalyser(): AnalyserNode {
    this.assertOpen();
    this.ensureContext();
    if (!this.analyserNode) {
      throw new AudioEngineError('AUDIO_CONTEXT_UNAVAILABLE', 'Analyser node is unavailable.');
    }
    return this.analyserNode;
  }

  getWorkletRegistry(): AudioWorkletRegistry {
    this.assertOpen();
    this.ensureContext();
    if (!this.worklets) {
      throw new AudioEngineError('AUDIO_CONTEXT_UNAVAILABLE', 'Worklet registry is unavailable.');
    }
    return this.worklets;
  }

  unload(): void {
    this.stop();
    this.audioBuffer = null;
    this.setState('idle');
  }

  async close(): Promise<void> {
    if (this.stateValue === 'closed') return;
    this.disconnectSource();
    this.stopMonitoring();
    const context = this.context;
    this.context = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.worklets = null;
    this.audioBuffer = null;
    if (context && context.state !== 'closed') await context.close();
    this.setState('closed');
    this.removeAllListeners();
  }

  private assertOpen(): void {
    if (this.stateValue === 'closed') {
      throw new AudioEngineError('ENGINE_CLOSED', 'The audio engine is closed.');
    }
  }

  private ensureContext(): AudioContext {
    this.assertOpen();
    if (this.context) return this.context;

    if (this.options.contextFactory) {
      this.context = this.options.contextFactory();
    } else {
      const browser = globalThis as typeof globalThis & {
        AudioContext?: BrowserAudioContextConstructor;
        webkitAudioContext?: BrowserAudioContextConstructor;
      };
      const Context = browser.AudioContext ?? browser.webkitAudioContext;
      if (!Context) {
        throw new AudioEngineError(
          'AUDIO_CONTEXT_UNAVAILABLE',
          'Web Audio API is unavailable in this environment.',
        );
      }
      this.context = new Context({
        latencyHint: this.options.latencyHint,
        sampleRate: this.options.sampleRate,
      });
    }

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.volumeValue;
    this.analyserNode = this.context.createAnalyser();
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.context.destination);
    this.worklets = new AudioWorkletRegistry(this.context);
    return this.context;
  }

  private requireBuffer(): AudioBuffer {
    if (!this.audioBuffer) {
      throw new AudioEngineError('BUFFER_NOT_LOADED', 'Load audio before playback.');
    }
    return this.audioBuffer;
  }

  private startSource(buffer: AudioBuffer): void {
    const context = this.ensureContext();
    if (!this.gainNode) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.onended = () => {
      if (this.sourceNode !== source) return;
      source.disconnect();
      this.sourceNode = null;
      this.positionSeconds = 0;
      this.stopMonitoring();
      this.setState('ready');
      this.emit('ended', this.snapshot);
    };
    this.sourceNode = source;
    this.startedAt = context.currentTime - this.positionSeconds;
    source.start(0, this.positionSeconds);
  }

  private disconnectSource(): void {
    const source = this.sourceNode;
    this.sourceNode = null;
    if (!source) return;
    source.onended = null;
    try {
      source.stop();
    } catch {
      // The source may already have ended between scheduling and cleanup.
    }
    source.disconnect();
  }

  private setState(state: AudioEngineState): void {
    if (this.stateValue === state) return;
    this.stateValue = state;
    this.emit('statechange', this.snapshot);
  }

  private startMonitoring(): void {
    this.stopMonitoring();
    this.monitorHandle = setInterval(() => this.emit('position', this.snapshot), 1000 / 30);
  }

  private stopMonitoring(): void {
    if (this.monitorHandle === null) return;
    clearInterval(this.monitorHandle);
    this.monitorHandle = null;
  }
}
