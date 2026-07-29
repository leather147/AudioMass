import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type MetadataTags = Record<string, unknown>;
type MetadataService = {
  id3: {
    ReadTags(buffer: ArrayBuffer): MetadataTags | null;
    WriteTags(buffer: ArrayBuffer, tags: MetadataTags): ArrayBuffer;
  };
  mp4: { ReadTags(buffer: ArrayBuffer): MetadataTags | null };
  read(buffer: ArrayBuffer): MetadataTags | null;
  readId3(buffer: ArrayBuffer): MetadataTags | null;
  readMp4(buffer: ArrayBuffer): MetadataTags | null;
  writeId3(buffer: ArrayBuffer, tags: MetadataTags): ArrayBuffer;
};

function loadMetadataService() {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'metadata-service.js'),
    'utf8',
  );
  const runtimeWindow = {} as {
    AMMetadataService?: MetadataService;
    ID3v2?: MetadataService['id3'];
    ID4?: MetadataService['mp4'];
  };
  runInNewContext(source, {
    ArrayBuffer,
    DataView,
    TextDecoder,
    Uint8Array,
    window: runtimeWindow,
  });
  if (!runtimeWindow.AMMetadataService || !runtimeWindow.ID3v2 || !runtimeWindow.ID4) {
    throw new Error('Metadata service did not install');
  }
  return runtimeWindow;
}

function ascii(value: string) {
  return Array.from(value, (character) => character.charCodeAt(0) & 0xff);
}

function uint32(value: number) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function synchsafe(value: number) {
  return [(value >>> 21) & 0x7f, (value >>> 14) & 0x7f, (value >>> 7) & 0x7f, value & 0x7f];
}

function atom(name: string, payload: number[]) {
  return [...uint32(payload.length + 8), ...ascii(name), ...payload];
}

function dataAtom(type: number, payload: number[]) {
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

function textAtom(name: string, value: string) {
  return atom(name, dataAtom(1, Array.from(new TextEncoder().encode(value))));
}

function mp4Fixture() {
  const track = atom('trkn', dataAtom(0, [0, 0, 0, 2, 0, 9, 0, 0]));
  const cover = atom('covr', dataAtom(14, [137, 80, 78, 71]));
  const list = atom('ilst', [
    ...textAtom('©nam', 'Song'),
    ...textAtom('©ART', 'Artist'),
    ...textAtom('©alb', 'Album'),
    ...textAtom('©day', '2026'),
    ...textAtom('©gen', 'Rock'),
    ...textAtom('©cmt', 'Note'),
    ...textAtom('©lyr', 'Words'),
    ...track,
    ...cover,
  ]);
  const metadata = atom('meta', [0, 0, 0, 0, ...list]);
  const movie = atom('moov', atom('udta', metadata));
  const fileType = atom('ftyp', ascii('M4A '));
  return Uint8Array.from([...fileType, ...movie]).buffer;
}

describe('generated metadata service', () => {
  it('installs named APIs and preserves the ID3v2/ID4 facades', () => {
    const runtime = loadMetadataService();
    expect(runtime.ID3v2?.ReadTags).toBe(runtime.AMMetadataService?.readId3);
    expect(runtime.ID3v2?.WriteTags).toBe(runtime.AMMetadataService?.writeId3);
    expect(runtime.ID4?.ReadTags).toBe(runtime.AMMetadataService?.readMp4);
  });

  it('writes the established ID3v2.3 layout and round-trips all editor fields', () => {
    const service = loadMetadataService().AMMetadataService!;
    const audio = Uint8Array.from([0xff, 0xfb, 0x90, 0x64, 1, 2, 3, 4]).buffer;
    const written = service.writeId3(audio, {
      album: 'Album',
      artist: 'Artist',
      comment: { text: 'Комментарий' },
      genre: '(17)Rock',
      lyrics: { lyrics: 'Line one' },
      picture: { data: [137, 80, 78, 71], format: 'image/png', type: 3 },
      title: 'Тест',
      track: '2/9',
      year: '2026',
    });

    expect(written.byteLength).toBe(261);
    expect(Array.from(new Uint8Array(written, 0, 10))).toEqual([73, 68, 51, 3, 0, 0, 0, 0, 1, 115]);
    expect(Array.from(new Uint8Array(written, written.byteLength - 8))).toEqual([
      0xff, 0xfb, 0x90, 0x64, 1, 2, 3, 4,
    ]);
    expect(service.read(written)).toEqual({
      album: 'Album',
      artist: 'Artist',
      comment: { language: 'eng', short_description: '', text: 'Комментарий' },
      genre: 'Rock',
      lyrics: { descriptor: '', language: 'eng', lyrics: 'Line one' },
      picture: {
        data: [137, 80, 78, 71],
        description: '',
        format: 'image/png',
        type: 3,
      },
      title: 'Тест',
      track: '2/9',
      year: '2026',
    });
  });

  it('replaces an existing ID3 block and decodes ID3v2.4 UTF-8 frames', () => {
    const service = loadMetadataService().AMMetadataService!;
    const audio = Uint8Array.from([0xff, 0xfb, 1, 2]).buffer;
    const first = service.writeId3(audio, { title: 'First' });
    const replaced = service.writeId3(first, { title: 'Second' });
    expect(service.readId3(replaced)?.title).toBe('Second');
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
    expect(service.readId3(fixture)?.title).toBe('Привет');
  });

  it('reads M4A text, track, comment, lyrics, and cover atoms', () => {
    const service = loadMetadataService().AMMetadataService!;
    expect(service.read(mp4Fixture())).toEqual({
      album: 'Album',
      artist: 'Artist',
      comment: { text: 'Note' },
      count: 9,
      genre: 'Rock',
      lyrics: 'Words',
      picture: { data: [137, 80, 78, 71], format: 'image/png' },
      title: 'Song',
      track: 2,
      year: '2026',
    });
  });

  it('rejects invalid and truncated metadata without throwing', () => {
    const service = loadMetadataService().AMMetadataService!;
    expect(service.readId3(new ArrayBuffer(4))).toBeNull();
    expect(
      service.readId3(Uint8Array.from([...ascii('ID3'), 3, 0, 0, 0, 0, 0, 64]).buffer),
    ).toBeNull();
    expect(service.read(new Uint8Array(64).buffer)).toBeNull();
  });
});
