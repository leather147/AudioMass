import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type FakeAudioBuffer = {
  getChannelData(channel: number): Float32Array;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
};

type ProjectFormat = {
  decodeMultitrack(buffer: ArrayBuffer, context: FakeAudioContext): Record<string, unknown> | null;
  encodeMultitrack(state: Record<string, unknown>): Blob | null;
  isBuffer(buffer: ArrayBuffer): boolean;
  isFile(file: { name: string }): boolean;
  normalizeName(name?: string): string;
};

type FakeAudioContext = {
  createBuffer(channels: number, length: number, sampleRate: number): FakeAudioBuffer;
};

function audioBuffer(channels: number[][], sampleRate = 48_000): FakeAudioBuffer {
  const samples = channels.map((channel) => Float32Array.from(channel));
  return {
    getChannelData: (channel) => samples[channel]!,
    length: samples[0]?.length ?? 0,
    numberOfChannels: samples.length,
    sampleRate,
  };
}

function audioContext(): FakeAudioContext {
  return {
    createBuffer(channels, length, sampleRate) {
      return audioBuffer(
        Array.from({ length: channels }, () => Array.from({ length }, () => 0)),
        sampleRate,
      );
    },
  };
}

function loadProjectFormat() {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'amss-format.js'),
    'utf8',
  );
  const runtimeWindow = {
    PKAudioEditor: { _deps: {} as Record<string, unknown> },
    URL: {
      createObjectURL: () => 'blob:amss',
      revokeObjectURL: () => undefined,
    },
  } as {
    AMProjectFormat?: ProjectFormat;
    PKAudioEditor: { _deps: Record<string, unknown> };
    URL: { createObjectURL(blob: Blob): string; revokeObjectURL(url: string): void };
  };
  const sandbox = {
    ArrayBuffer,
    Blob,
    DataView,
    FileReader: class {},
    Float32Array,
    TextDecoder,
    TextEncoder,
    Uint8Array,
    document: {
      body: { appendChild: () => undefined },
      createElement: () => ({
        click: () => undefined,
        parentNode: null,
        style: {},
      }),
    },
    setTimeout(callback: () => void) {
      callback();
      return 1;
    },
    window: runtimeWindow,
  };
  runInNewContext(source, sandbox);
  if (!runtimeWindow.AMProjectFormat) throw new Error('AMSS project format did not install');
  return { format: runtimeWindow.AMProjectFormat, runtimeWindow };
}

describe('generated AMSS project format', () => {
  it('installs a named service and the established editor facade', () => {
    const runtime = loadProjectFormat();
    expect(runtime.runtimeWindow.PKAudioEditor._deps.amss).toBeTypeOf('function');
    expect(runtime.format.normalizeName(' Session ')).toBe('Session.amss');
    expect(runtime.format.normalizeName('mix.AMSS')).toBe('mix.AMSS');
    expect(runtime.format.isFile({ name: 'mix.amss' })).toBe(true);
    expect(runtime.format.isFile({ name: 'mix.wav' })).toBe(false);
  });

  it('round-trips tracks, shared audio, clips, crossfades, tempo, and markers', async () => {
    const { format } = loadProjectFormat();
    const sharedAudio = audioBuffer([
      [0.25, -0.5, 0.75, -1],
      [-0.25, 0.5, -0.75, 1],
    ]);
    const blob = format.encodeMultitrack({
      beat_bpm: 127.5,
      beat_sig: '7/8',
      clips: [
        {
          buffer: sharedAudio,
          fi: 0.1,
          fo: 0.2,
          id: 'clip-a',
          in: 0,
          name: 'First',
          out: 4,
          start: 1.5,
          track: 'track-a',
        },
        {
          buffer: sharedAudio,
          id: 'clip-b',
          in: 1,
          name: 'Second',
          out: 3,
          start: 6,
          track: 'track-b',
        },
      ],
      cursor: 2.25,
      marker: 3.5,
      markers: [{ id: 'marker-1', time: 2 }],
      master_vol: 0.8,
      px_per_sec: 96,
      row_h: 72,
      selected_clip: 'clip-b',
      selected_track: 'track-b',
      tracks: [
        { h: 1.25, id: 'track-a', mute: true, name: 'Voice', pan: -0.2, vol: 0.7 },
        { id: 'track-b', name: 'Music', pan: 0.35, solo: true, vol: 0.9 },
      ],
      xfades: { 'clip-a:clip-b': 1 },
    });

    expect(blob?.type).toBe('application/x-audiomass-session');
    const encoded = await blob!.arrayBuffer();
    expect(format.isBuffer(encoded)).toBe(true);
    const decoded = format.decodeMultitrack(encoded, audioContext()) as {
      beat_bpm: number;
      beat_sig: string;
      clips: Array<{ buffer: FakeAudioBuffer; id: string; track: string }>;
      markers: unknown[];
      selected_clip: string;
      selected_track: string;
      tracks: Array<{ id: string; mute: boolean; name: string; solo: boolean }>;
      xfades: Record<string, number>;
    };

    expect(decoded.beat_bpm).toBeCloseTo(127.5);
    expect(decoded.beat_sig).toBe('7/8');
    expect(decoded.tracks).toMatchObject([
      { id: 'mt1', mute: true, name: 'Voice', solo: false },
      { id: 'mt2', mute: false, name: 'Music', solo: true },
    ]);
    expect(decoded.clips).toMatchObject([
      { id: 'mc1', track: 'mt1' },
      { id: 'mc2', track: 'mt2' },
    ]);
    expect(decoded.clips[0]!.buffer).toBe(decoded.clips[1]!.buffer);
    expect(Array.from(decoded.clips[0]!.buffer.getChannelData(1))).toEqual([-0.25, 0.5, -0.75, 1]);
    expect(decoded.xfades).toEqual({ 'mc1:mc2': 1 });
    expect(decoded.selected_track).toBe('mt2');
    expect(decoded.selected_clip).toBe('mc2');
    expect(decoded.markers).toEqual([{ id: 'marker-1', time: 2 }]);
  });

  it('rejects malformed and truncated sessions without throwing', () => {
    const { format } = loadProjectFormat();
    expect(format.isBuffer(new ArrayBuffer(3))).toBe(false);
    expect(format.decodeMultitrack(new ArrayBuffer(32), audioContext())).toBeNull();
    expect(
      format.decodeMultitrack(new Uint8Array([1, 65, 77, 83, 0]).buffer, audioContext()),
    ).toBeNull();
  });
});
