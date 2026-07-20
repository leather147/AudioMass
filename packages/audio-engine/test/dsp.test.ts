import { describe, expect, it } from 'vitest';

import {
  deinterleave,
  extractWaveformPeaks,
  fade,
  interleave,
  normalize,
  reverse,
  trim,
} from '@audio-engine/dsp';
import type { PcmAudio } from '@audio-engine/types';

const audio: PcmAudio = {
  channels: [new Float32Array([0, 0.5, -1, 0.25]), new Float32Array([0.25, -0.5, 0.75, 0])],
  sampleRate: 4,
};

describe('PCM processing', () => {
  it('trims and reverses without mutating the source', () => {
    const trimmed = trim(audio, 0.25, 0.75);
    expect(Array.from(trimmed.channels[0] ?? [])).toEqual([0.5, -1]);
    expect(Array.from(reverse(trimmed).channels[0] ?? [])).toEqual([-1, 0.5]);
    expect(Array.from(audio.channels[0] ?? [])).toEqual([0, 0.5, -1, 0.25]);
  });

  it('normalizes the absolute peak', () => {
    const normalized = normalize(audio, 0.5);
    const samples = normalized.channels.flatMap((channel) => Array.from(channel));
    expect(Math.max(...samples.map(Math.abs))).toBeCloseTo(0.5);
  });

  it('applies independent fade-in and fade-out envelopes', () => {
    const faded = fade(audio, 0.5, 0.5);
    expect(faded.channels[0]?.[0]).toBe(0);
    expect(faded.channels[0]?.[3]).toBe(0);
    expect(faded.channels[0]?.[1]).toBeCloseTo(0.5);
  });

  it('round-trips interleaved samples', () => {
    const roundTrip = deinterleave(interleave(audio), 2, audio.sampleRate);
    expect(Array.from(roundTrip.channels[0] ?? [])).toEqual(Array.from(audio.channels[0] ?? []));
    expect(Array.from(roundTrip.channels[1] ?? [])).toEqual(Array.from(audio.channels[1] ?? []));
  });
});

describe('waveform peaks', () => {
  it('combines all channels into deterministic min/max buckets', () => {
    const peaks = extractWaveformPeaks(audio, 2);
    expect(peaks.samplesPerPixel).toBe(2);
    expect(Array.from(peaks.min)).toEqual([-0.5, -1]);
    expect(Array.from(peaks.max)).toEqual([0.5, 0.75]);
  });
});
