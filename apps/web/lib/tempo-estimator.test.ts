import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type FakeAudioBuffer = {
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
};

type TempoResult = {
  beats: number;
  bpm: number;
  confidence: number;
  duration: number;
  offset: number;
  tempo: number;
};

type TempoEstimator = {
  analyze(buffer: FakeAudioBuffer): TempoResult;
  estimate(buffer: FakeAudioBuffer): Promise<TempoResult>;
};

function pulseBuffer(bpm: number, seconds = 12, sampleRate = 48_000): FakeAudioBuffer {
  const length = seconds * sampleRate;
  const samples = new Float32Array(length);
  const period = Math.round((sampleRate * 60) / bpm);
  for (let start = 0; start < length; start += period) {
    for (let index = start; index < Math.min(length, start + 240); index += 1) {
      samples[index] = 1 - (index - start) / 240;
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

function loadTempoEstimator() {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'tempo-estimator.js'),
    'utf8',
  );
  const sandbox = {
    setTimeout(callback: () => void) {
      callback();
      return 1;
    },
  } as typeof globalThis & {
    AMTempoEstimator?: TempoEstimator;
    PKTempoEstimator?: Pick<TempoEstimator, 'estimate'>;
  };
  runInNewContext(source, sandbox);
  if (!sandbox.AMTempoEstimator || !sandbox.PKTempoEstimator) {
    throw new Error('Tempo estimator did not install');
  }
  return sandbox;
}

describe('generated tempo estimator', () => {
  it('installs a named typed service and compatibility facade', () => {
    const runtime = loadTempoEstimator();
    expect(runtime.PKTempoEstimator?.estimate).toBe(runtime.AMTempoEstimator?.estimate);
  });

  it.each([
    { expectedBpm: 90, expectedTempo: 89.8, pulseBpm: 90 },
    { expectedBpm: 120, expectedTempo: 120, pulseBpm: 120 },
    { expectedBpm: 80, expectedTempo: 80, pulseBpm: 160 },
  ])('preserves the $pulseBpm BPM pulse-train fold decision', async (testCase) => {
    const runtime = loadTempoEstimator();
    const result = await runtime.AMTempoEstimator!.estimate(pulseBuffer(testCase.pulseBpm));

    expect(result.bpm).toBe(testCase.expectedBpm);
    expect(result.tempo).toBe(testCase.expectedTempo);
    expect(result.beats).toBeGreaterThan(10);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('rejects buffers shorter than the established minimum', async () => {
    const runtime = loadTempoEstimator();
    await expect(runtime.AMTempoEstimator!.estimate(pulseBuffer(120, 1))).rejects.toThrow(
      'Audio is too short to estimate tempo.',
    );
  });

  it('builds the worker from generated typed assets', () => {
    const worker = readFileSync(
      join(process.cwd(), 'public', 'editor-assets', 'tempo-worker.js'),
      'utf8',
    );
    expect(worker).toContain("importScripts('tempo-estimator.js?v=mt3')");
    expect(worker).toContain("message?.type !== 'estimate'");
  });
});
