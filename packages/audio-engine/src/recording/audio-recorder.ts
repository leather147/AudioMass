import { AudioEngineError } from '../errors.js';
import { AudioWorkletRegistry } from '../audio-worklet-registry.js';
import { TypedEventEmitter } from '../typed-event-emitter.js';
import {
  RECORDER_PROCESSOR_NAME,
  type RecorderFlushCommand,
  type RecorderProcessorMessage,
} from './recorder-protocol.js';

export interface AudioRecorderOptions {
  chunkSize?: number;
  constraints?: MediaTrackConstraints;
  mediaDevices?: Pick<MediaDevices, 'getUserMedia'>;
  workletUrl: string | URL;
}

export interface AudioRecording {
  samples: Float32Array;
  sampleRate: number;
}

export interface AudioRecorderEvents {
  data: Float32Array;
  error: Error;
  start: undefined;
  stop: AudioRecording;
}

export function mergeRecordedChunks(chunks: readonly Float32Array[]): Float32Array {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  return samples;
}

function isAudioWorkletNode(node: AudioNode | null): node is AudioWorkletNode {
  return typeof AudioWorkletNode !== 'undefined' && node instanceof AudioWorkletNode;
}

export class AudioRecorder extends TypedEventEmitter<AudioRecorderEvents> {
  private readonly chunkSize: number;
  private readonly chunks: Float32Array[] = [];
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private monitor: GainNode | null = null;
  private node: AudioNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private stateValue: 'idle' | 'recording' | 'starting' | 'stopping' = 'idle';
  private stream: MediaStream | null = null;
  private readonly worklets: AudioWorkletRegistry;

  public constructor(
    private readonly context: AudioContext,
    private readonly options: AudioRecorderOptions,
  ) {
    super();
    this.chunkSize = options.chunkSize ?? 4096;
    if (!Number.isInteger(this.chunkSize) || this.chunkSize < 128) {
      throw new RangeError('Recorder chunk size must be an integer of at least 128 samples.');
    }
    this.worklets = new AudioWorkletRegistry(context);
  }

  public get state(): 'idle' | 'recording' | 'starting' | 'stopping' {
    return this.stateValue;
  }

  public async start(): Promise<void> {
    if (this.stateValue !== 'idle')
      throw new Error(`Cannot start recorder while ${this.stateValue}.`);
    const mediaDevices = this.options.mediaDevices ?? navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      throw new AudioEngineError('AUDIO_CONTEXT_UNAVAILABLE', 'Media capture is unavailable.');
    }

    this.stateValue = 'starting';
    this.chunks.length = 0;
    try {
      await this.context.resume();
      this.stream = await mediaDevices.getUserMedia({
        audio: this.options.constraints ?? {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      this.mediaSource = this.context.createMediaStreamSource(this.stream);
      this.monitor = this.context.createGain();
      this.monitor.gain.value = 0;

      try {
        const node = await this.worklets.createNode(
          this.options.workletUrl,
          RECORDER_PROCESSOR_NAME,
          {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            processorOptions: { chunkSize: this.chunkSize },
          },
        );
        node.port.onmessage = (event: MessageEvent<RecorderProcessorMessage>) => {
          if (event.data.type === 'chunk') this.acceptChunk(new Float32Array(event.data.samples));
        };
        this.node = node;
      } catch {
        this.startScriptFallback();
      }

      this.mediaSource.connect(this.node!);
      this.node!.connect(this.monitor);
      this.monitor.connect(this.context.destination);
      this.stateValue = 'recording';
      this.emit('start', undefined);
    } catch (error) {
      this.cleanup();
      const recorderError =
        error instanceof Error ? error : new Error('Unable to start audio recording.');
      this.emit('error', recorderError);
      throw recorderError;
    }
  }

  public async stop(): Promise<AudioRecording> {
    if (this.stateValue !== 'recording') {
      throw new Error(`Cannot stop recorder while ${this.stateValue}.`);
    }
    this.stateValue = 'stopping';
    const node = this.node;
    if (isAudioWorkletNode(node)) await this.flushWorklet(node);
    const recording = {
      sampleRate: this.context.sampleRate,
      samples: mergeRecordedChunks(this.chunks),
    };
    this.cleanup();
    this.emit('stop', recording);
    return recording;
  }

  public cancel(): void {
    this.chunks.length = 0;
    this.cleanup();
  }

  private acceptChunk(samples: Float32Array): void {
    if (this.stateValue !== 'recording' && this.stateValue !== 'stopping') return;
    const owned = samples.slice();
    this.chunks.push(owned);
    this.emit('data', owned);
  }

  private startScriptFallback(): void {
    const node = this.context.createScriptProcessor(this.chunkSize, 1, 1);
    node.onaudioprocess = (event) => this.acceptChunk(event.inputBuffer.getChannelData(0));
    this.scriptNode = node;
    this.node = node;
  }

  private flushWorklet(node: AudioWorkletNode): Promise<void> {
    return new Promise((resolve) => {
      const timeout = window.setTimeout(resolve, 100);
      node.port.onmessage = (event: MessageEvent<RecorderProcessorMessage>) => {
        if (event.data.type === 'chunk') {
          this.acceptChunk(new Float32Array(event.data.samples));
          return;
        }
        window.clearTimeout(timeout);
        resolve();
      };
      const command: RecorderFlushCommand = { type: 'flush' };
      node.port.postMessage(command);
    });
  }

  private cleanup(): void {
    if (this.scriptNode) this.scriptNode.onaudioprocess = null;
    if (isAudioWorkletNode(this.node)) this.node.port.onmessage = null;
    for (const node of [this.mediaSource, this.node, this.monitor]) {
      try {
        node?.disconnect();
      } catch {
        // A browser may disconnect a node before recorder cleanup runs.
      }
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.mediaSource = null;
    this.monitor = null;
    this.node = null;
    this.scriptNode = null;
    this.stream = null;
    this.stateValue = 'idle';
  }
}
