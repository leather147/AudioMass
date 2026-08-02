import { describe, expect, it } from 'vitest';

import { FrequencyAnalysisWorkerClient, type FrequencyAnalysisRequest } from '../src/index.js';

class FakeWorker extends EventTarget {
  public message: FrequencyAnalysisRequest | null = null;
  public terminated = false;

  public postMessage(message: FrequencyAnalysisRequest): void {
    this.message = message;
    queueMicrotask(() => {
      this.dispatchEvent(
        new MessageEvent('message', {
          data: {
            analysis: {
              spectrogram: {
                duration: 1,
                frameCount: 1,
                frequencies: Float32Array.from([0, 100]),
                magnitudesDb: Float32Array.from([-120, -6]),
                times: Float32Array.from([0.5]),
              },
              spectrum: {
                frequencies: Float32Array.from([0, 100]),
                magnitudesDb: Float32Array.from([-120, -6]),
                sampleRate: 1000,
              },
            },
            id: message.id,
            type: 'frequency-analyzed',
          },
        }),
      );
    });
  }

  public terminate(): void {
    this.terminated = true;
  }
}

describe('FrequencyAnalysisWorkerClient', () => {
  it('transfers an owned PCM copy, correlates its result, and disposes the worker', async () => {
    const worker = new FakeWorker();
    const source = Float32Array.from([0, 1, 0, -1]);
    const client = new FrequencyAnalysisWorkerClient(() => worker as unknown as Worker);

    await expect(
      client.analyze({ channels: [source], sampleRate: 1000 }, { fftSize: 256, frameCount: 1 }),
    ).resolves.toMatchObject({ spectrum: { sampleRate: 1000 } });
    expect(worker.message).toMatchObject({
      options: { fftSize: 256, frameCount: 1 },
      type: 'analyze-frequency',
    });
    expect(worker.message?.audio.channels[0]).not.toBe(source);
    expect(Array.from(source)).toEqual([0, 1, 0, -1]);

    client.destroy();
    expect(worker.terminated).toBe(true);
  });
});
