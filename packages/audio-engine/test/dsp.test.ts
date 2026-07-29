import { describe, expect, it } from 'vitest';

import {
  deinterleave,
  extractPcmRange,
  extractWaveformPeaks,
  fade,
  interleave,
  insertPcm,
  normalizePlaybackRate,
  normalize,
  playbackDuration,
  playbackRateAt,
  removePcmRange,
  reverse,
  trim,
} from '@audio-engine/dsp';
import type { PcmAudio } from '@audio-engine/types';
import { encodePcmAsWav } from '@audio-engine/codecs/wav';

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

describe('WAV encoding', () => {
  it('encodes PCM through an importable codec without worker globals', () => {
    const wav = encodePcmAsWav(audio, 16);
    const view = new DataView(wav);
    const text = (offset: number, length: number) =>
      String.fromCharCode(...new Uint8Array(wav, offset, length));

    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 4)).toBe('WAVE');
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(4);
    expect(view.getUint16(34, true)).toBe(16);
  });
});

describe('effect automation', () => {
  const profile = normalizePlaybackRate({
    points: [
      { position: 1, value: 2 },
      { position: 0, value: 1 },
    ],
    type: 'profile',
  });

  it('normalizes and interpolates typed playback-rate profiles', () => {
    expect(typeof profile).not.toBe('number');
    expect(playbackRateAt(profile, 0.5)).toBe(1.5);
    expect(playbackDuration(profile, 3)).toBe(2);
  });
});

describe('immutable PCM editing', () => {
  it('extracts, removes, and inserts ranges without mutating source audio', () => {
    const extracted = extractPcmRange(audio, { end: 0.75, start: 0.25 });
    expect(Array.from(extracted.channels[0] ?? [])).toEqual([0.5, -1]);

    const removed = removePcmRange(audio, { end: 0.75, start: 0.25 });
    expect(Array.from(removed.channels[0] ?? [])).toEqual([0, 0.25]);

    const inserted = insertPcm(removed, 0.25, extracted);
    expect(Array.from(inserted.channels[0] ?? [])).toEqual([0, 0.5, -1, 0.25]);
    expect(Array.from(audio.channels[0] ?? [])).toEqual([0, 0.5, -1, 0.25]);
  });
});
