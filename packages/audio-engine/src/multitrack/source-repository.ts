import { clonePcm } from '../dsp/pcm.js';
import type { PcmAudio } from '../types.js';
import type { AudioSourceRepository } from './bounce.js';

export interface MutableAudioSourceRepository extends AudioSourceRepository {
  clear(): void;
  delete(sourceId: string): boolean;
  has(sourceId: string): boolean;
  set(sourceId: string, audio: PcmAudio): void;
}

/**
 * Owns PCM at the multitrack boundary. Both reads and writes are copied so a
 * browser decoder, playback node, or export consumer cannot mutate project
 * source data through a shared Float32Array reference.
 */
export class InMemoryAudioSourceRepository implements MutableAudioSourceRepository {
  readonly #sources = new Map<string, PcmAudio>();

  clear(): void {
    this.#sources.clear();
  }

  delete(sourceId: string): boolean {
    return this.#sources.delete(sourceId);
  }

  get(sourceId: string): PcmAudio | undefined {
    const source = this.#sources.get(sourceId);
    return source ? clonePcm(source) : undefined;
  }

  has(sourceId: string): boolean {
    return this.#sources.has(sourceId);
  }

  set(sourceId: string, audio: PcmAudio): void {
    if (!sourceId.trim()) throw new TypeError('Audio source id must not be empty.');
    this.#sources.set(sourceId, clonePcm(audio));
  }
}
