import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it, vi } from 'vitest';

type RatePoint = { val: number; x: number };

type EffectUtilities = {
  applyBufferGains(buffer: FakeAudioBuffer, gains: number[]): void;
  clampRate(value: unknown): number;
  fadeCurve(fadeGain: (value: number) => number, reverse?: boolean): Float32Array;
  peakNormalizeGains(stats: { maxPeak: number; peaks: number[] }, value: unknown[]): number[];
  peakNormalizeStats(buffer: FakeAudioBuffer): { maxPeak: number; peaks: number[] };
  rateAt(points: RatePoint[], position: number): number;
  rateDuration(value: unknown, duration: number): number;
  ratePoints(value: unknown, duration: number): RatePoint[] | null;
  rmsNormalizeGains(
    stats: { chans: Array<{ peak: number; rms: number }>; peak: number; rms: number },
    value: unknown[],
  ): number[];
  rmsNormalizeStats(buffer: FakeAudioBuffer): {
    chans: Array<{ peak: number; rms: number }>;
    peak: number;
    rms: number;
  };
  setRate(
    parameter: {
      cancelScheduledValues(time: number): void;
      linearRampToValueAtTime(value: number, time: number): void;
      setValueAtTime(value: number, time: number): void;
    },
    audioContext: { currentTime: number },
    value: unknown,
    duration: number,
    seek?: number,
  ): void;
};

class FakeAudioBuffer {
  readonly numberOfChannels: number;
  private readonly channels: Float32Array[];

  constructor(channels: number[][]) {
    this.channels = channels.map((channel) => Float32Array.from(channel));
    this.numberOfChannels = this.channels.length;
  }

  getChannelData(channel: number) {
    const data = this.channels[channel];
    if (!data) throw new RangeError(`Missing channel ${channel}`);
    return data;
  }
}

function loadUtilities() {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'audio-effect-utilities.js'),
    'utf8',
  );
  const runtimeWindow = {} as { AMAudioEffectUtilities?: EffectUtilities };
  runInNewContext(source, { window: runtimeWindow });
  if (!runtimeWindow.AMAudioEffectUtilities) {
    throw new Error('Audio effect utilities did not install');
  }
  return runtimeWindow.AMAudioEffectUtilities;
}

describe('generated audio effect utilities', () => {
  it('replaces DSP helper implementations in the compatibility host', () => {
    const actions = readFileSync(join(process.cwd(), 'editor-runtime', 'actions.ts'), 'utf8');
    expect(actions).toContain('window.AMAudioEffectUtilities');
    expect(actions).not.toMatch(
      /function\s+(fadeCurve|applyBufferGains|peakNormalizeStats|rmsNormalizeStats|ratePoints)/,
    );
  });

  it('builds forward and reverse fade curves through the injected curve function', () => {
    const utilities = loadUtilities();
    const forward = Array.from(utilities.fadeCurve((value) => value * value));
    const reverse = Array.from(utilities.fadeCurve((value) => value * value, true));

    expect(forward[0]).toBe(0);
    expect(forward.at(-1)).toBe(1);
    expect(reverse[0]).toBe(1);
    expect(reverse.at(-1)).toBe(0);
  });

  it('computes normalization statistics and applies channel gains', () => {
    const utilities = loadUtilities();
    const buffer = new FakeAudioBuffer([
      [0, 0.5, -1, 0.25],
      [0, -0.25, 0.5, 0.75],
    ]);
    const peakStats = utilities.peakNormalizeStats(buffer);
    const rmsStats = utilities.rmsNormalizeStats(buffer);

    expect(peakStats.peaks).toEqual([0.5, 0.25]);
    expect(utilities.peakNormalizeGains(peakStats, [true, 1])).toEqual([2, 2]);
    expect(rmsStats.peak).toBe(1);
    expect(rmsStats.rms).toBeCloseTo(Math.sqrt(2.1875 / 8));
    expect(utilities.rmsNormalizeGains(rmsStats, [true, 0])).toEqual([0.99, 0.99]);

    utilities.applyBufferGains(buffer, [2, 0.5]);
    expect(Array.from(buffer.getChannelData(0))).toEqual([0, 1, -2, 0.5]);
    expect(Array.from(buffer.getChannelData(1))).toEqual([0, -0.125, 0.25, 0.375]);
  });

  it('normalizes rate profiles and schedules playback automation', () => {
    const utilities = loadUtilities();
    const profile = {
      points: [
        { val: 0, x: 0.25 },
        { val: 8, x: 0.75 },
      ],
      type: 'profile',
    };
    const points = utilities.ratePoints(profile, 10);

    expect(points).toEqual([
      { val: 0.05, x: 0 },
      { val: 0.05, x: 0.25 },
      { val: 4, x: 0.75 },
      { val: 4, x: 1 },
    ]);
    expect(utilities.clampRate('2')).toBe(2);
    expect(utilities.rateDuration(2, 10)).toBe(5);
    expect(utilities.rateAt(points!, 0.5)).toBeCloseTo(2.025);

    const parameter = {
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      setValueAtTime: vi.fn(),
    };
    utilities.setRate(parameter, { currentTime: 3 }, profile, 10, 5);
    expect(parameter.cancelScheduledValues).toHaveBeenCalledWith(3);
    expect(parameter.setValueAtTime).toHaveBeenCalledWith(2.025, 3);
    expect(parameter.linearRampToValueAtTime).toHaveBeenCalledTimes(2);
  });
});
