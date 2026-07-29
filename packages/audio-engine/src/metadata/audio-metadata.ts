export interface AudioPicture {
  data: Uint8Array;
  description?: string;
  format?: string;
  type?: number;
}

export interface AudioComment {
  language?: string;
  shortDescription?: string;
  text: string;
}

export interface AudioLyrics {
  descriptor?: string;
  language?: string;
  text: string;
}

export interface AudioMetadata {
  album?: string;
  artist?: string;
  comment?: AudioComment;
  genre?: string;
  lyrics?: AudioLyrics | string;
  picture?: AudioPicture;
  title?: string;
  track?: number | string;
  trackCount?: number;
  year?: string;
}

const ID3_FRAMES = {
  album: ['TALB', 'TAL'],
  artist: ['TPE1', 'TP1'],
  comment: ['COMM', 'COM'],
  genre: ['TCON', 'TCO'],
  lyrics: ['USLT', 'ULT'],
  picture: ['APIC', 'PIC'],
  title: ['TIT2', 'TT2'],
  track: ['TRCK', 'TRK'],
  year: ['TDRC', 'TYER', 'TYE'],
} as const;

function bytes(view: DataView, offset: number, length: number): Uint8Array {
  if (offset < 0 || length < 0 || offset + length > view.byteLength) return new Uint8Array();
  return new Uint8Array(view.buffer, view.byteOffset + offset, length).slice();
}

function ascii(view: DataView, offset: number, length: number): string {
  return String.fromCharCode(...bytes(view, offset, length));
}

function synchsafe(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7f) << 21) |
    ((view.getUint8(offset + 1) & 0x7f) << 14) |
    ((view.getUint8(offset + 2) & 0x7f) << 7) |
    (view.getUint8(offset + 3) & 0x7f)
  );
}

function decodeText(input: Uint8Array, encoding: number): { consumed: number; value: string } {
  if (!input.length) return { consumed: 0, value: '' };
  const unit: 1 | 2 = encoding === 1 || encoding === 2 ? 2 : 1;
  let consumed = input.length;
  let payloadLength = input.length;
  for (let index = 0; index + unit - 1 < input.length; index += unit) {
    if (input[index] === 0 && (unit === 1 || input[index + 1] === 0)) {
      payloadLength = index;
      consumed = index + unit;
      break;
    }
  }
  let payload = input.subarray(0, payloadLength);
  let label = encoding === 3 ? 'utf-8' : 'iso-8859-1';
  if (encoding === 1 || encoding === 2) {
    const bigEndian = encoding === 2 || (payload[0] === 0xfe && payload[1] === 0xff);
    if (payload[0] === 0xfe && payload[1] === 0xff) payload = payload.subarray(2);
    else if (payload[0] === 0xff && payload[1] === 0xfe) payload = payload.subarray(2);
    if (bigEndian) {
      const swapped = payload.slice();
      for (let index = 0; index + 1 < swapped.length; index += 2) {
        [swapped[index], swapped[index + 1]] = [swapped[index + 1]!, swapped[index]!];
      }
      payload = swapped;
    }
    label = 'utf-16le';
  }
  return { consumed, value: new TextDecoder(label).decode(payload) };
}

function parseId3Frame(id: string, payload: Uint8Array, version: number): unknown {
  const encoding = payload[0] ?? 0;
  if (id.startsWith('T')) {
    const value = decodeText(payload.subarray(1), encoding).value;
    return id === 'TCON' || id === 'TCO' ? value.replace(/^\(\d+\)/, '') : value;
  }
  if (id === 'COMM' || id === 'COM') {
    const language = new TextDecoder('iso-8859-1').decode(payload.subarray(1, 4));
    const description = decodeText(payload.subarray(4), encoding);
    return {
      language,
      shortDescription: description.value,
      text: decodeText(payload.subarray(4 + description.consumed), encoding).value,
    } satisfies AudioComment;
  }
  if (id === 'USLT' || id === 'ULT') {
    const language = new TextDecoder('iso-8859-1').decode(payload.subarray(1, 4));
    const descriptor = decodeText(payload.subarray(4), encoding);
    return {
      descriptor: descriptor.value,
      language,
      text: decodeText(payload.subarray(4 + descriptor.consumed), encoding).value,
    } satisfies AudioLyrics;
  }
  if (id === 'APIC' || id === 'PIC') {
    let offset = 1;
    let format: string;
    if (version === 2) {
      format = new TextDecoder('iso-8859-1').decode(payload.subarray(offset, offset + 3));
      offset += 3;
    } else {
      const mime = decodeText(payload.subarray(offset), 0);
      format = mime.value;
      offset += mime.consumed;
    }
    const type = payload[offset++] ?? 0;
    const description = decodeText(payload.subarray(offset), encoding);
    offset += description.consumed;
    return { data: payload.subarray(offset).slice(), description: description.value, format, type };
  }
  return undefined;
}

export function readId3Metadata(buffer: ArrayBuffer): AudioMetadata | null {
  if (buffer.byteLength < 10) return null;
  try {
    const view = new DataView(buffer);
    if (ascii(view, 0, 3) !== 'ID3') return null;
    const version = view.getUint8(3);
    if (version < 2 || version > 4) return null;
    const end = 10 + synchsafe(view, 6);
    if (end > view.byteLength || (view.getUint8(5) & 0x80) !== 0) return null;
    let offset = 10;
    if ((view.getUint8(5) & 0x40) !== 0) {
      if (offset + 4 > end) return null;
      offset += view.getUint32(offset, version === 3) + (version === 3 ? 4 : 0);
    }
    const found = new Map<string, unknown>();
    while (offset < end) {
      const header = version === 2 ? 6 : 10;
      if (offset + header > end) break;
      const id = ascii(view, offset, version === 2 ? 3 : 4);
      const size =
        version === 2
          ? (view.getUint8(offset + 3) << 16) |
            (view.getUint8(offset + 4) << 8) |
            view.getUint8(offset + 5)
          : version === 4
            ? synchsafe(view, offset + 4)
            : view.getUint32(offset + 4);
      if (!size || offset + header + size > end) break;
      const payload = bytes(view, offset + header, size);
      if (!found.has(id)) found.set(id, parseId3Frame(id, payload, version));
      offset += header + size;
    }
    const metadata: AudioMetadata = {};
    for (const [name, ids] of Object.entries(ID3_FRAMES)) {
      const value = ids.map((id) => found.get(id)).find((candidate) => candidate !== undefined);
      if (value !== undefined) (metadata as Record<string, unknown>)[name] = value;
    }
    return metadata;
  } catch {
    return null;
  }
}

function asciiBytes(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0) & 0xff);
}

function uint32Bytes(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function synchsafeBytes(value: number): number[] {
  return [(value >>> 21) & 0x7f, (value >>> 14) & 0x7f, (value >>> 7) & 0x7f, value & 0x7f];
}

function utf16(value: unknown, bom = true): number[] {
  const output = bom ? [0xff, 0xfe] : [];
  const text = String(value ?? '');
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    output.push(code & 0xff, code >> 8);
  }
  return output;
}

function id3Frame(id: string, payload: number[]): number[] {
  return payload.length
    ? [...asciiBytes(id), ...uint32Bytes(payload.length), 0, 0, ...payload]
    : [];
}

function textFrame(value: unknown): number[] {
  return value === undefined || value === null || value === '' ? [] : [1, ...utf16(value)];
}

function existingId3Size(buffer: ArrayBuffer): number {
  if (buffer.byteLength < 10) return 0;
  const view = new DataView(buffer);
  if (ascii(view, 0, 3) !== 'ID3') return 0;
  const size = 10 + synchsafe(view, 6) + ((view.getUint8(5) & 0x10) !== 0 ? 10 : 0);
  return size <= buffer.byteLength ? size : 0;
}

export function writeId3Metadata(buffer: ArrayBuffer, tags: AudioMetadata): ArrayBuffer {
  const comment = tags.comment?.text ?? '';
  const lyrics = typeof tags.lyrics === 'string' ? tags.lyrics : (tags.lyrics?.text ?? '');
  const picture = tags.picture;
  const frames = [
    ...id3Frame('TIT2', textFrame(tags.title)),
    ...id3Frame('TPE1', textFrame(tags.artist)),
    ...id3Frame('TALB', textFrame(tags.album)),
    ...id3Frame('TYER', textFrame(tags.year)),
    ...id3Frame('TCON', textFrame(tags.genre)),
    ...id3Frame('TRCK', textFrame(tags.track)),
    ...id3Frame(
      'COMM',
      comment ? [1, ...asciiBytes('eng'), ...utf16(''), 0, 0, ...utf16(comment)] : [],
    ),
    ...id3Frame(
      'USLT',
      lyrics ? [1, ...asciiBytes('eng'), ...utf16(''), 0, 0, ...utf16(lyrics)] : [],
    ),
    ...id3Frame(
      'APIC',
      picture?.data.length
        ? [
            0,
            ...asciiBytes(picture.format ?? 'image/jpeg'),
            0,
            picture.type ?? 3,
            0,
            ...picture.data,
          ]
        : [],
    ),
  ];
  const header = [...asciiBytes('ID3'), 3, 0, 0, ...synchsafeBytes(frames.length)];
  const audio = new Uint8Array(buffer, existingId3Size(buffer));
  const output = new Uint8Array(header.length + frames.length + audio.length);
  output.set(header);
  output.set(frames, header.length);
  output.set(audio, header.length + frames.length);
  return output.buffer;
}

const MP4_MAPPING: Record<string, keyof AudioMetadata> = {
  aART: 'artist',
  covr: 'picture',
  trkn: 'track',
  '©ART': 'artist',
  '©alb': 'album',
  '©art': 'artist',
  '©cmt': 'comment',
  '©day': 'year',
  '©gen': 'genre',
  '©lyr': 'lyrics',
  '©nam': 'title',
};

function readMp4Atoms(
  metadata: AudioMetadata,
  view: DataView,
  offset: number,
  length: number,
): void {
  let cursor = offset;
  const end = Math.min(offset + length, view.byteLength);
  while (cursor + 8 <= end) {
    const size = view.getUint32(cursor);
    if (size < 8 || cursor + size > end) return;
    const name = ascii(view, cursor + 4, 4);
    if (name === 'meta') readMp4Atoms(metadata, view, cursor + 12, size - 12);
    else if (name === 'moov' || name === 'udta' || name === 'ilst') {
      readMp4Atoms(metadata, view, cursor + 8, size - 8);
    } else if (MP4_MAPPING[name]) {
      if (cursor + 24 > end) return;
      if (name === 'trkn') {
        if (cursor + 30 > end) return;
        metadata.track = view.getUint16(cursor + 26);
        metadata.trackCount = view.getUint16(cursor + 28);
      } else {
        const type =
          (view.getUint8(cursor + 17) << 16) |
          (view.getUint8(cursor + 18) << 8) |
          view.getUint8(cursor + 19);
        const payload = bytes(view, cursor + 24, size - 24);
        let value: unknown;
        if (type === 1) value = new TextDecoder().decode(payload);
        else if (type === 13 || type === 14)
          value = { data: payload, format: type === 13 ? 'image/jpeg' : 'image/png' };
        else if (type === 0 || type === 21)
          value = payload.length >= 2 ? new DataView(payload.buffer).getUint16(0, true) : 0;
        const key = MP4_MAPPING[name]!;
        (metadata as Record<string, unknown>)[key] =
          key === 'comment' ? { text: String(value ?? '') } : value;
      }
    }
    cursor += size;
  }
}

export function readMp4Metadata(buffer: ArrayBuffer): AudioMetadata | null {
  if (buffer.byteLength < 8) return null;
  try {
    const metadata: AudioMetadata = {};
    readMp4Atoms(metadata, new DataView(buffer), 0, buffer.byteLength);
    return Object.keys(metadata).length ? metadata : null;
  } catch {
    return null;
  }
}

export function readAudioMetadata(buffer: ArrayBuffer): AudioMetadata | null {
  const input = new Uint8Array(buffer);
  if (input[0] === 73 && input[1] === 68 && input[2] === 51) return readId3Metadata(buffer);
  if (input[4] === 102 && input[5] === 116 && input[6] === 121 && input[7] === 112) {
    return readMp4Metadata(buffer);
  }
  return null;
}
