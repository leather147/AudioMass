import { describe, expect, it } from 'vitest';

import {
  readAudioMetadata,
  readId3Metadata,
  readMp4Metadata,
  writeId3Metadata,
} from '../src/index.js';

function ascii(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0) & 0xff);
}

function uint32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function synchsafe(value: number): number[] {
  return [(value >>> 21) & 0x7f, (value >>> 14) & 0x7f, (value >>> 7) & 0x7f, value & 0x7f];
}

function atom(name: string, payload: number[]): number[] {
  return [...uint32(payload.length + 8), ...ascii(name), ...payload];
}

function dataAtom(type: number, payload: number[]): number[] {
  return atom('data', [
    0,
    (type >>> 16) & 0xff,
    (type >>> 8) & 0xff,
    type & 0xff,
    0,
    0,
    0,
    0,
    ...payload,
  ]);
}

function textAtom(name: string, value: string): number[] {
  return atom(name, dataAtom(1, Array.from(new TextEncoder().encode(value))));
}

function mp4Fixture(): ArrayBuffer {
  const list = atom('ilst', [
    ...textAtom('©nam', 'Song'),
    ...textAtom('©ART', 'Artist'),
    ...textAtom('©alb', 'Album'),
    ...textAtom('©day', '2026'),
    ...textAtom('©gen', 'Rock'),
    ...textAtom('©cmt', 'Note'),
    ...textAtom('©lyr', 'Words'),
    ...atom('trkn', dataAtom(0, [0, 0, 2, 1, 1, 2, 0, 0])),
    ...atom('covr', dataAtom(14, [137, 80, 78, 71])),
  ]);
  return Uint8Array.from([
    ...atom('ftyp', ascii('M4A ')),
    ...atom('moov', atom('udta', atom('meta', [0, 0, 0, 0, ...list]))),
  ]).buffer;
}

describe('audio metadata', () => {
  it('writes the ID3v2.3 layout and round-trips editor fields', () => {
    const audio = Uint8Array.from([0xff, 0xfb, 0x90, 0x64, 1, 2, 3, 4]).buffer;
    const written = writeId3Metadata(audio, {
      album: 'Album',
      artist: 'Artist',
      comment: { text: 'Комментарий' },
      genre: '(17)Rock',
      lyrics: { text: 'Line one' },
      picture: { data: Uint8Array.from([137, 80, 78, 71]), format: 'image/png', type: 3 },
      title: 'Тест 🎧',
      track: '2/9',
      year: '2026',
    });
    expect(written.byteLength).toBe(267);
    expect(Array.from(new Uint8Array(written, written.byteLength - 8))).toEqual([
      0xff, 0xfb, 0x90, 0x64, 1, 2, 3, 4,
    ]);
    expect(readAudioMetadata(written)).toEqual({
      album: 'Album',
      artist: 'Artist',
      comment: { language: 'eng', shortDescription: '', text: 'Комментарий' },
      genre: 'Rock',
      lyrics: { descriptor: '', language: 'eng', text: 'Line one' },
      picture: {
        data: Uint8Array.from([137, 80, 78, 71]),
        description: '',
        format: 'image/png',
        type: 3,
      },
      title: 'Тест 🎧',
      track: '2/9',
      year: '2026',
    });
  });

  it('replaces old tags and decodes ID3v2.4 UTF-8', () => {
    const audio = Uint8Array.from([0xff, 0xfb, 1, 2]).buffer;
    const replaced = writeId3Metadata(writeId3Metadata(audio, { title: 'First' }), {
      title: 'Second',
    });
    expect(readId3Metadata(replaced)?.title).toBe('Second');
    expect(Array.from(new Uint8Array(replaced, replaced.byteLength - 4))).toEqual([
      0xff, 0xfb, 1, 2,
    ]);

    const payload = [3, ...new TextEncoder().encode('Привет')];
    const frame = [...ascii('TIT2'), ...synchsafe(payload.length), 0, 0, ...payload];
    const fixture = Uint8Array.from([
      ...ascii('ID3'),
      4,
      0,
      0,
      ...synchsafe(frame.length),
      ...frame,
    ]).buffer;
    expect(readId3Metadata(fixture)?.title).toBe('Привет');
  });

  it('reads M4A text, track, comment, lyrics, and cover atoms', () => {
    expect(readAudioMetadata(mp4Fixture())).toEqual({
      album: 'Album',
      artist: 'Artist',
      comment: { text: 'Note' },
      genre: 'Rock',
      lyrics: 'Words',
      picture: { data: Uint8Array.from([137, 80, 78, 71]), format: 'image/png' },
      title: 'Song',
      track: 513,
      trackCount: 258,
      year: '2026',
    });
  });

  it('returns null for truncated or unsupported data', () => {
    expect(readId3Metadata(new ArrayBuffer(4))).toBeNull();
    expect(readMp4Metadata(new Uint8Array(64).buffer)).toBeNull();
    expect(readAudioMetadata(new Uint8Array(64).buffer)).toBeNull();
  });
});
