import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type FakeAudioBuffer = {
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
};

type LoudnessReport = {
  blocks: number;
  lufs: number;
  peak: number;
  peakDb: number;
  rms: number;
  rmsDb: number;
  truePeak: number;
  truePeakDb: number;
};

type LoudnessAnalysis = {
  analyze(buffer: FakeAudioBuffer): LoudnessReport;
  db(value: number): number;
  gainForTarget(
    report: LoudnessReport,
    target: unknown,
    ceiling: unknown,
  ): {
    expectedLUFS: number;
    expectedTruePeakDb: number;
    gain: number;
    gainDb: number;
    limited: boolean;
  };
  integratedLUFS(buffer: FakeAudioBuffer): number;
};

function makeBuffer(channels: Float32Array[], sampleRate = 48_000): FakeAudioBuffer {
  return {
    getChannelData: (channel) => channels[channel]!,
    length: channels[0]?.length ?? 0,
    numberOfChannels: channels.length,
    sampleRate,
  };
}

function loadLoudnessAnalysis() {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'loudness-analysis.js'),
    'utf8',
  );
  const editor = { _deps: {} as { lufs?: LoudnessAnalysis } };
  const runtimeWindow = { PKAudioEditor: editor } as {
    AMLoudnessAnalysis?: LoudnessAnalysis;
    PKAudioEditor: typeof editor;
  };
  runInNewContext(source, { window: runtimeWindow });
  if (!runtimeWindow.AMLoudnessAnalysis) throw new Error('Loudness service did not install');
  return { editor, service: runtimeWindow.AMLoudnessAnalysis };
}

describe('generated loudness analysis service', () => {
  it('installs the typed service through the established editor facade', () => {
    const { editor, service } = loadLoudnessAnalysis();
    expect(editor._deps.lufs).toBe(service);
  });

  it('reports deterministic silence values', () => {
    const { service } = loadLoudnessAnalysis();
    const report = service.analyze(makeBuffer([new Float32Array(48_000)]));

    expect(report).toMatchObject({
      blocks: 7,
      lufs: Number.NEGATIVE_INFINITY,
      peak: 0,
      peakDb: -120,
      rms: 0,
      rmsDb: -120,
      truePeak: 0,
      truePeakDb: -120,
    });
    expect(service.integratedLUFS(makeBuffer([new Float32Array(16)]))).toBe(
      Number.NEGATIVE_INFINITY,
    );
  });

  it('measures a sine wave and preserves peak and RMS contracts', () => {
    const { service } = loadLoudnessAnalysis();
    const samples = Float32Array.from({ length: 48_000 }, (_, index) =>
      Math.sin((2 * Math.PI * 1_000 * index) / 48_000),
    );
    const report = service.analyze(makeBuffer([samples]));

    expect(report.lufs).toBeGreaterThan(-10);
    expect(report.lufs).toBeLessThan(0);
    expect(report.peak).toBeCloseTo(1, 5);
    expect(report.rms).toBeCloseTo(Math.SQRT1_2, 4);
    expect(report.truePeak).toBeGreaterThanOrEqual(report.peak);
    expect(service.db(1)).toBe(0);
  });

  it('limits target gain to the requested true-peak ceiling', () => {
    const { service } = loadLoudnessAnalysis();
    const report = {
      blocks: 1,
      lufs: -20,
      peak: 0.5,
      peakDb: -6,
      rms: 0.25,
      rmsDb: -12,
      truePeak: 0.7,
      truePeakDb: -3,
    };

    expect(service.gainForTarget(report, -14, -1)).toMatchObject({
      expectedLUFS: -18,
      expectedTruePeakDb: -1,
      gainDb: 2,
      limited: true,
    });
    expect(service.gainForTarget({ ...report, truePeakDb: -20 }, -14, -1)).toMatchObject({
      expectedLUFS: -14,
      gainDb: 6,
      limited: false,
    });
  });
});
