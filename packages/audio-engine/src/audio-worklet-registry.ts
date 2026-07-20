import { AudioEngineError } from './errors.js';

export class AudioWorkletRegistry {
  private readonly modules = new Map<string, Promise<void>>();

  constructor(private readonly context: AudioContext) {}

  load(url: string | URL): Promise<void> {
    const key = url.toString();
    const existing = this.modules.get(key);
    if (existing) return existing;
    if (!this.context.audioWorklet) {
      return Promise.reject(
        new AudioEngineError('AUDIO_CONTEXT_UNAVAILABLE', 'AudioWorklet is not supported.'),
      );
    }
    const loading = this.context.audioWorklet.addModule(key).catch((error: unknown) => {
      this.modules.delete(key);
      throw new AudioEngineError('AUDIO_DECODE_FAILED', `Unable to load worklet: ${key}`, {
        cause: error,
      });
    });
    this.modules.set(key, loading);
    return loading;
  }

  async createNode(
    moduleUrl: string | URL,
    processorName: string,
    options?: AudioWorkletNodeOptions,
  ): Promise<AudioWorkletNode> {
    await this.load(moduleUrl);
    return new AudioWorkletNode(this.context, processorName, options);
  }
}
