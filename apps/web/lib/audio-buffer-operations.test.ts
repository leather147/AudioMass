import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it, vi } from 'vitest';

class FakeAudioBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly duration: number;
  private readonly channels: Float32Array[];

  constructor(
    readonly sampleRate: number,
    channelData: ArrayLike<number>[],
  ) {
    this.channels = channelData.map((channel) => Float32Array.from(channel));
    this.numberOfChannels = this.channels.length;
    this.length = this.channels[0]?.length ?? 0;
    this.duration = this.length / sampleRate;
  }

  getChannelData(channel: number) {
    const data = this.channels[channel];
    if (!data) throw new RangeError(`Missing channel ${channel}`);
    return data;
  }
}

type BufferOperations = {
  copySegment(offset: number, duration: number): FakeAudioBuffer;
  insertFloatArrays(offset: number, arrays: Float32Array[]): [number, number];
  insertSegment(offset: number, buffer: FakeAudioBuffer): [number, number];
  makeSilence(duration: number): FakeAudioBuffer;
  replaceFloatArrays(offset: number, arrays: Float32Array[]): [number, number];
  trim(offset: number, duration: number, force?: boolean): FakeAudioBuffer;
};

function createHarness(channels: number[][], activeChannels = channels.map(() => 1)) {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'audio-buffer-operations.js'),
    'utf8',
  );
  const runtimeWindow = { setTimeout: (callback: () => void) => callback() } as {
    AMAudioBufferOperations?: {
      create(wavesurfer: object, onDurationChange: (duration: number) => void): BufferOperations;
    };
    setTimeout(callback: () => void): void;
  };
  runInNewContext(source, { window: runtimeWindow });

  const durationChanges: number[] = [];
  const backend = {
    ac: {
      createBuffer(channelCount: number, length: number, sampleRate: number) {
        return new FakeAudioBuffer(
          sampleRate,
          Array.from({ length: channelCount }, () => new Float32Array(length)),
        );
      },
    },
    buffer: new FakeAudioBuffer(2, channels),
  };
  const wavesurfer = {
    ActiveChannels: activeChannels,
    SelectedChannelsLen: activeChannels.filter(Boolean).length,
    backend,
    drawBuffer: vi.fn(),
    getDuration: () => backend.buffer.duration,
    loadDecodedBuffer(buffer: FakeAudioBuffer) {
      backend.buffer = buffer;
    },
  };
  const operations = runtimeWindow.AMAudioBufferOperations?.create(wavesurfer, (duration) =>
    durationChanges.push(duration),
  );
  if (!operations) throw new Error('Audio buffer operations did not install');
  return { backend, durationChanges, operations, wavesurfer };
}

function values(buffer: FakeAudioBuffer, channel = 0) {
  return Array.from(buffer.getChannelData(channel));
}

describe('generated audio buffer operations', () => {
  it('replaces the duplicated buffer implementations in the compatibility host', () => {
    const actions = readFileSync(
      join(process.cwd(), 'editor-runtime', 'static', 'actions.js'),
      'utf8',
    );
    expect(actions).toContain('bufferOperations.trim');
    expect(actions).toContain('bufferOperations.insertSegment');
    expect(actions).not.toMatch(/function\s+(TrimBuffer|InsertSegmentToBuffer|CopyBufferSegment)/);
  });

  it('copies only active channels and creates silence with the source format', () => {
    const { operations } = createHarness(
      [
        [0, 1, 2, 3],
        [10, 11, 12, 13],
      ],
      [0, 1],
    );

    expect(values(operations.copySegment(0.5, 1))).toEqual([11, 12]);
    const silence = operations.makeSilence(1.5);
    expect(silence.numberOfChannels).toBe(2);
    expect(silence.length).toBe(3);
  });

  it('trims and inserts buffers while publishing the resulting duration', () => {
    const { backend, durationChanges, operations } = createHarness([
      [0, 1, 2, 3],
      [10, 11, 12, 13],
    ]);

    const removed = operations.trim(0.5, 1, true);
    expect(values(removed)).toEqual([1, 2]);
    expect(values(backend.buffer)).toEqual([0, 3]);
    expect(durationChanges).toEqual([1]);

    expect(operations.insertSegment(0.5, new FakeAudioBuffer(2, [[8]]))).toEqual([0.5, 1]);
    expect(values(backend.buffer)).toEqual([0, 8, 3]);
    expect(durationChanges).toEqual([1, 1.5]);
  });

  it('replaces and inserts chunked float arrays without losing surrounding samples', () => {
    const replacement = [Float32Array.of(7, 8), Float32Array.of(9, 10)];
    const first = createHarness([[0, 1, 2, 3, 4, 5]]);
    expect(first.operations.replaceFloatArrays(0.5, replacement)).toEqual([0.5, 2.5]);
    expect(values(first.backend.buffer)).toEqual([0, 7, 8, 9, 10, 5]);

    const second = createHarness([[0, 1, 2, 3, 4, 5]]);
    expect(second.operations.insertFloatArrays(0.5, replacement)).toEqual([0.5, 2.5]);
    expect(values(second.backend.buffer)).toEqual([0, 7, 8, 9, 10, 1, 2, 3, 4, 5]);
  });
});
