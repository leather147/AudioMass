import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type WavSamples = Float32Array | Int16Array | Int32Array;

type WavEncoder = {
  encode(
    samples: WavSamples,
    options: { bitDepth: 16 | 24 | 32; channels: number; sampleRate: number },
  ): ArrayBuffer;
  interleave(left: WavSamples, right: WavSamples): WavSamples;
};

function loadWavEncoder() {
  const source = readFileSync(join(process.cwd(), 'public', 'editor-assets', 'wav.js'), 'utf8');
  const postedMessages: unknown[] = [];
  const sandbox = {
    Blob,
    postMessage(message: unknown) {
      postedMessages.push(message);
    },
  } as typeof globalThis & {
    AMWavEncoder?: WavEncoder;
    onmessage?: (event: { data: ArrayBuffer | Record<string, number> | null }) => void;
  };
  runInNewContext(source, sandbox);
  if (!sandbox.AMWavEncoder || !sandbox.onmessage) {
    throw new Error('WAV encoder did not install');
  }
  return { encoder: sandbox.AMWavEncoder, onmessage: sandbox.onmessage, postedMessages };
}

function ascii(view: DataView, offset: number, length: number) {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join(
    '',
  );
}

describe('generated WAV encoder', () => {
  it('writes a PCM16 mono RIFF header and sample payload', () => {
    const { encoder } = loadWavEncoder();
    const encoded = encoder.encode(new Int16Array([-32_768, 0, 32_767]), {
      bitDepth: 16,
      channels: 1,
      sampleRate: 48_000,
    });
    const view = new DataView(encoded);

    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(ascii(view, 8, 4)).toBe('WAVE');
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(48_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(view, 36, 4)).toBe('data');
    expect(view.getInt16(44, true)).toBe(-32_768);
    expect(view.getInt16(48, true)).toBe(32_767);
  });

  it('interleaves stereo samples and preserves signed 24-bit bytes', () => {
    const { encoder } = loadWavEncoder();
    const samples = encoder.interleave(
      new Int32Array([0x123456, -1]),
      new Int32Array([0x010203, -0x800000]),
    );
    const view = new DataView(
      encoder.encode(samples, { bitDepth: 24, channels: 2, sampleRate: 44_100 }),
    );

    expect(Array.from(new Uint8Array(view.buffer, 44, 12))).toEqual([
      0x56, 0x34, 0x12, 0x03, 0x02, 0x01, 0xff, 0xff, 0xff, 0x00, 0x00, 0x80,
    ]);
  });

  it('writes the IEEE float format and fact chunk for 32-bit exports', () => {
    const { encoder } = loadWavEncoder();
    const view = new DataView(
      encoder.encode(new Float32Array([-0.5, 0.5]), {
        bitDepth: 32,
        channels: 1,
        sampleRate: 96_000,
      }),
    );

    expect(view.getUint16(20, true)).toBe(3);
    expect(view.getUint32(16, true)).toBe(18);
    expect(ascii(view, 38, 4)).toBe('fact');
    expect(view.getUint32(46, true)).toBe(2);
    expect(ascii(view, 50, 4)).toBe('data');
    expect(view.getFloat32(58, true)).toBeCloseTo(-0.5);
  });

  it('preserves the worker configuration and Blob response protocol', async () => {
    const runtime = loadWavEncoder();
    runtime.onmessage({
      data: { bit_depth: 16, channels: 1, kbps: 128, sample_rate: 44_100 },
    });
    runtime.onmessage({ data: new Int16Array([100, -100]).buffer });

    expect(runtime.postedMessages).toHaveLength(1);
    const blob = runtime.postedMessages[0];
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe('audio/wav');
    expect(ascii(new DataView(await (blob as Blob).arrayBuffer()), 0, 4)).toBe('RIFF');
  });
});
