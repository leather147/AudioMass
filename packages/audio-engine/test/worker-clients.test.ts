import { describe, expect, it } from 'vitest';

import {
  TempoWorkerClient,
  WavEncoderWorkerClient,
  type TempoAnalyzeRequest,
  type WavEncodeRequest,
} from '../src/index.js';

class FakeWorker extends EventTarget {
  public lastMessage: TempoAnalyzeRequest | WavEncodeRequest | null = null;
  public terminated = false;

  public constructor(
    private readonly respond: (
      request: TempoAnalyzeRequest | WavEncodeRequest,
      worker: FakeWorker,
    ) => void,
  ) {
    super();
  }

  public postMessage(message: TempoAnalyzeRequest | WavEncodeRequest): void {
    this.lastMessage = message;
    queueMicrotask(() => this.respond(message, this));
  }

  public reply(data: object): void {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }

  public terminate(): void {
    this.terminated = true;
  }
}

function asWorker(worker: FakeWorker): Worker {
  return worker as unknown as Worker;
}

describe('typed audio worker clients', () => {
  it('transfers owned PCM copies and resolves a WAV response by request id', async () => {
    const encoded = Uint8Array.from([82, 73, 70, 70]).buffer;
    const worker = new FakeWorker((request, target) => {
      expect(request.type).toBe('encode');
      target.reply({ id: request.id, type: 'encoded', wav: encoded });
    });
    const source = Float32Array.from([0, 0.5, -0.5]);
    const client = new WavEncoderWorkerClient(() => asWorker(worker));

    await expect(client.encode({ channels: [source], sampleRate: 48_000 }, 24)).resolves.toBe(
      encoded,
    );
    expect(worker.lastMessage).toMatchObject({ bitDepth: 24, sampleRate: 48_000, type: 'encode' });
    expect(worker.lastMessage?.channels[0]).not.toBe(source.buffer);
    expect(Array.from(source)).toEqual([0, 0.5, -0.5]);

    client.destroy();
    expect(worker.terminated).toBe(true);
  });

  it('rejects a discriminated worker failure without leaking pending work', async () => {
    const worker = new FakeWorker((request, target) => {
      target.reply({ error: 'encoder rejected input', id: request.id, type: 'error' });
    });
    const client = new WavEncoderWorkerClient(() => asWorker(worker));

    await expect(
      client.encode({ channels: [new Float32Array(4)], sampleRate: 44_100 }),
    ).rejects.toThrow('encoder rejected input');
    client.destroy();
  });

  it('uses the tempo worker protocol without transferring caller-owned buffers', async () => {
    const worker = new FakeWorker((request, target) => {
      expect(request.type).toBe('analyze');
      target.reply({
        id: request.id,
        result: { beats: 12, bpm: 120, confidence: 96, duration: 6, offset: 0, tempo: 120 },
        type: 'analyzed',
      });
    });
    const source = new Float32Array(48_000 * 6);
    const client = new TempoWorkerClient(() => asWorker(worker));

    await expect(
      client.analyze({ channels: [source], sampleRate: 48_000 }, { maxTempo: 180 }),
    ).resolves.toMatchObject({ bpm: 120, tempo: 120 });
    expect(worker.lastMessage).toMatchObject({
      options: { maxTempo: 180 },
      sampleRate: 48_000,
      type: 'analyze',
    });
    expect(worker.lastMessage?.channels[0]).not.toBe(source.buffer);

    client.destroy();
  });
});
