import { describe, expect, it } from 'vitest';

import { analyzeTempo, type AudioBufferView } from '../src/index.js';

function pulseBuffer(bpm: number, seconds = 12, sampleRate = 48_000): AudioBufferView {
  const length = seconds * sampleRate;
  const samples = new Float32Array(length);
  const interval = Math.round((sampleRate * 60) / bpm);
  for (let start = 0; start < length; start += interval) {
    for (let offset = 0; offset < 500 && start + offset < length; offset += 1) {
      samples[start + offset] = 1 - offset / 500;
    }
  }
  return {
    duration: seconds,
    getChannelData: () => samples,
    length,
    numberOfChannels: 1,
    sampleRate,
  };
}

describe('tempo analysis', () => {
  it.each([
    [90, 90, 89.8],
    [120, 120, 120],
    [160, 80, 80],
  ])('preserves the %i BPM fold contract', (input, bpm, tempo) => {
    expect(analyzeTempo(pulseBuffer(input))).toMatchObject({ bpm, tempo });
  });

  it('rejects audio shorter than the established minimum', () => {
    expect(() => analyzeTempo(pulseBuffer(120, 1))).toThrow('Audio is too short');
  });
});
