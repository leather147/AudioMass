import { AudioEngineError } from './errors.js';

const READ_INDEX = 0;
const WRITE_INDEX = 1;
const HEADER_LENGTH = 2;

export interface SharedRingBufferDescriptor {
  buffer: SharedArrayBuffer;
  capacityFrames: number;
  channelCount: number;
}

export class SharedAudioRingBuffer {
  readonly capacityFrames: number;
  readonly channelCount: number;
  private readonly data: Float32Array;
  private readonly header: Int32Array;
  private readonly storageFrames: number;

  constructor(descriptor: SharedRingBufferDescriptor) {
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new AudioEngineError(
        'SHARED_MEMORY_UNAVAILABLE',
        'SharedArrayBuffer requires a cross-origin isolated browser context.',
      );
    }
    if (
      !Number.isInteger(descriptor.capacityFrames) ||
      descriptor.capacityFrames <= 0 ||
      !Number.isInteger(descriptor.channelCount) ||
      descriptor.channelCount <= 0
    ) {
      throw new AudioEngineError('INVALID_AUDIO_DATA', 'Ring buffer dimensions must be positive.');
    }

    this.capacityFrames = descriptor.capacityFrames;
    this.channelCount = descriptor.channelCount;
    this.storageFrames = descriptor.capacityFrames + 1;
    const headerBytes = HEADER_LENGTH * Int32Array.BYTES_PER_ELEMENT;
    const requiredBytes =
      headerBytes + this.storageFrames * descriptor.channelCount * Float32Array.BYTES_PER_ELEMENT;
    if (descriptor.buffer.byteLength !== requiredBytes) {
      throw new AudioEngineError('INVALID_AUDIO_DATA', 'Ring buffer byte length is invalid.');
    }
    this.header = new Int32Array(descriptor.buffer, 0, HEADER_LENGTH);
    this.data = new Float32Array(descriptor.buffer, headerBytes);
  }

  static create(capacityFrames: number, channelCount: number): SharedAudioRingBuffer {
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new AudioEngineError(
        'SHARED_MEMORY_UNAVAILABLE',
        'SharedArrayBuffer requires a cross-origin isolated browser context.',
      );
    }
    const storageFrames = capacityFrames + 1;
    const bytes =
      HEADER_LENGTH * Int32Array.BYTES_PER_ELEMENT +
      storageFrames * channelCount * Float32Array.BYTES_PER_ELEMENT;
    return new SharedAudioRingBuffer({
      buffer: new SharedArrayBuffer(bytes),
      capacityFrames,
      channelCount,
    });
  }

  get descriptor(): SharedRingBufferDescriptor {
    return {
      buffer: this.header.buffer as SharedArrayBuffer,
      capacityFrames: this.capacityFrames,
      channelCount: this.channelCount,
    };
  }

  get availableReadFrames(): number {
    const read = Atomics.load(this.header, READ_INDEX);
    const write = Atomics.load(this.header, WRITE_INDEX);
    return (write - read + this.storageFrames) % this.storageFrames;
  }

  get availableWriteFrames(): number {
    return this.capacityFrames - this.availableReadFrames;
  }

  write(interleavedSamples: Float32Array): number {
    const requestedFrames = Math.floor(interleavedSamples.length / this.channelCount);
    const frames = Math.min(requestedFrames, this.availableWriteFrames);
    let write = Atomics.load(this.header, WRITE_INDEX);
    for (let frame = 0; frame < frames; frame += 1) {
      for (let channel = 0; channel < this.channelCount; channel += 1) {
        this.data[write * this.channelCount + channel] =
          interleavedSamples[frame * this.channelCount + channel] ?? 0;
      }
      write = (write + 1) % this.storageFrames;
    }
    Atomics.store(this.header, WRITE_INDEX, write);
    Atomics.notify(this.header, WRITE_INDEX);
    return frames;
  }

  read(target: Float32Array): number {
    const requestedFrames = Math.floor(target.length / this.channelCount);
    const frames = Math.min(requestedFrames, this.availableReadFrames);
    let read = Atomics.load(this.header, READ_INDEX);
    for (let frame = 0; frame < frames; frame += 1) {
      for (let channel = 0; channel < this.channelCount; channel += 1) {
        target[frame * this.channelCount + channel] =
          this.data[read * this.channelCount + channel] ?? 0;
      }
      read = (read + 1) % this.storageFrames;
    }
    Atomics.store(this.header, READ_INDEX, read);
    Atomics.notify(this.header, READ_INDEX);
    return frames;
  }

  clear(): void {
    Atomics.store(this.header, READ_INDEX, 0);
    Atomics.store(this.header, WRITE_INDEX, 0);
  }
}
