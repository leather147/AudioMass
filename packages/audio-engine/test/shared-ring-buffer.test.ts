import { describe, expect, it } from 'vitest';

import { SharedAudioRingBuffer } from '@audio-engine/shared-ring-buffer';

describe('SharedAudioRingBuffer', () => {
  it('writes and reads interleaved frames in order', () => {
    const ring = SharedAudioRingBuffer.create(4, 2);
    expect(ring.write(new Float32Array([1, 2, 3, 4, 5, 6]))).toBe(3);
    expect(ring.availableReadFrames).toBe(3);

    const target = new Float32Array(4);
    expect(ring.read(target)).toBe(2);
    expect(Array.from(target)).toEqual([1, 2, 3, 4]);
    expect(ring.availableReadFrames).toBe(1);
  });

  it('wraps without overwriting unread frames', () => {
    const ring = SharedAudioRingBuffer.create(3, 1);
    expect(ring.write(new Float32Array([1, 2, 3, 4]))).toBe(3);
    const first = new Float32Array(2);
    expect(ring.read(first)).toBe(2);
    expect(ring.write(new Float32Array([4, 5, 6]))).toBe(2);

    const remaining = new Float32Array(3);
    expect(ring.read(remaining)).toBe(3);
    expect(Array.from(remaining)).toEqual([3, 4, 5]);
  });

  it('can attach a second view to the same shared memory', () => {
    const writer = SharedAudioRingBuffer.create(2, 1);
    const reader = new SharedAudioRingBuffer(writer.descriptor);
    writer.write(new Float32Array([0.25, -0.25]));
    const target = new Float32Array(2);
    reader.read(target);
    expect(Array.from(target)).toEqual([0.25, -0.25]);
  });
});
