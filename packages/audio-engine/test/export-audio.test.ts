import { describe, expect, it } from 'vitest';

import { AudioExportService, type AudioBinaryEncoder, type WavBitDepth } from '../src/index.js';

class FakeEncoder implements AudioBinaryEncoder {
  public bitDepth: WavBitDepth | null = null;

  public async encode(
    _audio: { channels: readonly Float32Array[]; sampleRate: number },
    bitDepth: WavBitDepth,
  ) {
    this.bitDepth = bitDepth;
    return Uint8Array.from([82, 73, 70, 70]).buffer;
  }
}

describe('AudioExportService', () => {
  it('returns a portable WAV result through an injected encoder', async () => {
    const encoder = new FakeEncoder();
    const exported = await new AudioExportService().exportWav(
      { channels: [new Float32Array(8)], sampleRate: 48_000 },
      'mix: final?.mp3',
      encoder,
      24,
    );

    expect(encoder.bitDepth).toBe(24);
    expect(exported).toMatchObject({ fileName: 'mix_ final_.wav', mimeType: 'audio/wav' });
    expect(Array.from(new Uint8Array(exported.bytes))).toEqual([82, 73, 70, 70]);
  });

  it('uses a stable fallback for an unsafe empty name', async () => {
    const exported = await new AudioExportService().exportWav(
      { channels: [new Float32Array(1)], sampleRate: 1 },
      '?.wav',
      new FakeEncoder(),
    );
    expect(exported.fileName).toBe('_.wav');
  });
});
