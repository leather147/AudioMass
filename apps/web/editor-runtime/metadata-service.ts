(() => {
  type Charset = 'iso-8859-1' | 'utf-16' | 'utf-16be' | 'utf-8';
  type DecodedString = { bytesRead: number; value: string };
  type FrameFlags = {
    format: { data_length_indicator: boolean; unsynchronisation: boolean };
  };
  type FrameReader = (
    offset: number,
    length: number,
    data: DataView,
    flags?: FrameFlags | null,
    version?: '2' | '3' | '4',
  ) => unknown;
  type Picture = {
    data: number[] | Uint8Array;
    description?: string;
    format?: string;
    type?: number;
  };
  type Comment = { language?: string; short_description?: string; text: string };
  type Lyrics = { descriptor?: string; language?: string; lyrics: string };
  type MetadataTags = {
    album?: string;
    artist?: string;
    comment?: Comment;
    count?: number;
    genre?: string;
    lyrics?: Lyrics | string;
    picture?: Picture;
    title?: string;
    track?: number | string;
    year?: string;
    [key: string]: unknown;
  };
  type Id3Api = {
    ReadTags(buffer: ArrayBuffer): MetadataTags | null;
    WriteTags(buffer: ArrayBuffer, tags: MetadataTags): ArrayBuffer;
    readFrameData: Record<string, FrameReader>;
  };
  type Mp4Api = {
    ReadTags(buffer: ArrayBuffer): MetadataTags | null;
    atom: Record<string, [keyof MetadataTags]>;
    types: Record<string, 'jpeg' | 'png' | 'text' | 'uint8'>;
  };
  type MetadataService = {
    id3: Id3Api;
    mp4: Mp4Api;
    read(buffer: ArrayBuffer): MetadataTags | null;
    readId3(buffer: ArrayBuffer): MetadataTags | null;
    readMp4(buffer: ArrayBuffer): MetadataTags | null;
    writeId3(buffer: ArrayBuffer, tags: MetadataTags): ArrayBuffer;
  };
  type RuntimeWindow = typeof window & {
    AMMetadataService?: MetadataService;
    ID3v2?: Id3Api;
    ID4?: Mp4Api;
  };

  const SHORTCUTS = {
    album: ['TALB', 'TAL'],
    artist: ['TPE1', 'TP1'],
    comment: ['COMM', 'COM'],
    genre: ['TCON', 'TCO'],
    lyrics: ['USLT', 'ULT'],
    picture: ['APIC', 'PIC'],
    title: ['TIT2', 'TT2'],
    track: ['TRCK', 'TRK'],
    year: ['TDRC', 'TYER', 'TYE'],
  } satisfies Record<string, string[]>;

  function bytesAt(data: DataView, offset: number, length: number) {
    if (offset < 0 || length < 0 || offset + length > data.byteLength) return [];
    return Array.from({ length }, (_, index) => data.getUint8(offset + index));
  }

  function stringAt(data: DataView, offset: number, length: number) {
    if (offset < 0 || length < 0 || offset + length > data.byteLength) return '';
    return String.fromCharCode(...bytesAt(data, offset, length));
  }

  function readLatin1(bytes: number[], maxBytes = bytes.length): DecodedString {
    const length = Math.min(maxBytes || bytes.length, bytes.length);
    const characters: string[] = [];
    let offset = 0;
    while (offset < length) {
      const byte = bytes[offset++]!;
      if (byte === 0) break;
      characters.push(String.fromCharCode(byte));
    }
    return { bytesRead: offset, value: characters.join('') };
  }

  function readUtf8(bytes: number[], maxBytes = bytes.length): DecodedString {
    const length = Math.min(maxBytes || bytes.length, bytes.length);
    let end = 0;
    while (end < length && bytes[end] !== 0) end += 1;
    const bytesRead = end < length ? end + 1 : end;
    const value = new TextDecoder('utf-8').decode(Uint8Array.from(bytes.slice(0, end)));
    return { bytesRead, value };
  }

  function readUtf16(bytes: number[], bigEndian: boolean, maxBytes = bytes.length): DecodedString {
    const length = Math.min(maxBytes || bytes.length, bytes.length);
    let offset = 0;
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      bigEndian = true;
      offset = 2;
    } else if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      bigEndian = false;
      offset = 2;
    }
    const codeUnits: number[] = [];
    while (offset + 1 < length) {
      const first = bytes[offset]!;
      const second = bytes[offset + 1]!;
      const codeUnit = bigEndian ? (first << 8) + second : (second << 8) + first;
      offset += 2;
      if (codeUnit === 0) break;
      codeUnits.push(codeUnit);
    }
    return { bytesRead: offset, value: String.fromCharCode(...codeUnits) };
  }

  function decodedStringAt(
    data: DataView,
    offset: number,
    length: number,
    charset?: Charset,
  ): DecodedString {
    const bytes = bytesAt(data, offset, length);
    if (charset === 'utf-16' || charset === 'utf-16be') {
      return readUtf16(bytes, charset === 'utf-16be');
    }
    if (charset === 'utf-8') return readUtf8(bytes);
    return readLatin1(bytes);
  }

  function uint32(data: DataView, offset: number, bigEndian: boolean) {
    return data.getUint32(offset, !bigEndian);
  }

  function uint16(data: DataView, offset: number, bigEndian: boolean) {
    return data.getUint16(offset, !bigEndian);
  }

  function uint24(data: DataView, offset: number, bigEndian: boolean) {
    const first = data.getUint8(offset);
    const second = data.getUint8(offset + 1);
    const third = data.getUint8(offset + 2);
    return bigEndian
      ? (first << 16) + (second << 8) + third
      : (third << 16) + (second << 8) + first;
  }

  function bit(data: DataView, offset: number, index: number) {
    return (data.getUint8(offset) & (1 << index)) !== 0;
  }

  function synchsafe(data: DataView, offset: number) {
    return (
      ((data.getUint8(offset) & 0x7f) << 21) |
      ((data.getUint8(offset + 1) & 0x7f) << 14) |
      ((data.getUint8(offset + 2) & 0x7f) << 7) |
      (data.getUint8(offset + 3) & 0x7f)
    );
  }

  function textEncoding(value: number): Charset {
    if (value === 1) return 'utf-16';
    if (value === 2) return 'utf-16be';
    if (value === 3) return 'utf-8';
    return 'iso-8859-1';
  }

  const frameReaders: Record<string, FrameReader> = {};

  frameReaders.APIC = (offset, length, data, _flags, version = '3') => {
    const start = offset;
    const charset = textEncoding(data.getUint8(offset));
    let format: string;
    if (version === '2') {
      format = stringAt(data, offset + 1, 3);
      offset += 4;
    } else {
      const decodedFormat = decodedStringAt(data, offset + 1, length - (offset - start));
      format = decodedFormat.value;
      offset += 1 + decodedFormat.bytesRead;
    }
    const type = data.getUint8(offset);
    const description = decodedStringAt(data, offset + 1, length - (offset - start), charset);
    offset += 1 + description.bytesRead;
    return {
      data: bytesAt(data, offset, start + length - offset),
      description: description.value,
      format,
      type,
    } satisfies Picture;
  };

  frameReaders.COMM = (offset, length, data) => {
    const start = offset;
    const charset = textEncoding(data.getUint8(offset));
    const language = stringAt(data, offset + 1, 3);
    const description = decodedStringAt(data, offset + 4, length - 4, charset);
    offset += 4 + description.bytesRead;
    return {
      language,
      short_description: description.value,
      text: decodedStringAt(data, offset, start + length - offset, charset).value,
    } satisfies Comment;
  };
  frameReaders.COM = frameReaders.COMM;
  frameReaders.PIC = (offset, length, data, flags) =>
    frameReaders.APIC!(offset, length, data, flags, '2');
  frameReaders['T*'] = (offset, length, data) =>
    decodedStringAt(data, offset + 1, length - 1, textEncoding(data.getUint8(offset))).value;
  frameReaders.TCON = (...arguments_) =>
    String(frameReaders['T*']!(...arguments_)).replace(/^\(\d+\)/, '');
  frameReaders.TCO = frameReaders.TCON;
  frameReaders.USLT = (offset, length, data) => {
    const start = offset;
    const charset = textEncoding(data.getUint8(offset));
    const language = stringAt(data, offset + 1, 3);
    const descriptor = decodedStringAt(data, offset + 4, length - 4, charset);
    offset += 4 + descriptor.bytesRead;
    return {
      descriptor: descriptor.value,
      language,
      lyrics: decodedStringAt(data, offset, start + length - offset, charset).value,
    } satisfies Lyrics;
  };
  frameReaders.ULT = frameReaders.USLT;

  function readFrames(data: DataView, offset: number, end: number, major: number) {
    const frames: Record<string, unknown> = {};
    const wanted = new Set(Object.values(SHORTCUTS).flat());
    end = Math.min(end, data.byteLength);
    while (offset < end) {
      let frameId: string;
      let frameSize: number;
      let headerSize: number;
      if (major === 2) {
        if (offset + 6 > end) break;
        frameId = stringAt(data, offset, 3);
        frameSize = uint24(data, offset + 3, true);
        headerSize = 6;
      } else {
        if (offset + 10 > end) break;
        frameId = stringAt(data, offset, 4);
        frameSize = major === 4 ? synchsafe(data, offset + 4) : uint32(data, offset + 4, true);
        headerSize = 10;
      }
      if (!frameSize || offset + headerSize + frameSize > end) break;
      const frameStart = offset;
      offset += headerSize + frameSize;
      if (!wanted.has(frameId)) continue;

      const flags: FrameFlags | null =
        major > 2
          ? {
              format: {
                data_length_indicator: bit(data, frameStart + 9, 0),
                unsynchronisation: bit(data, frameStart + 9, 1),
              },
            }
          : null;
      let payloadOffset = frameStart + headerSize;
      if (flags?.format.data_length_indicator) {
        payloadOffset += 4;
        frameSize -= 4;
      }
      if (flags?.format.unsynchronisation) continue;
      const reader =
        frameReaders[frameId] ?? (frameId.startsWith('T') ? frameReaders['T*'] : undefined);
      if (!(frameId in frames)) {
        frames[frameId] = reader?.(
          payloadOffset,
          frameSize,
          data,
          flags,
          String(major) as '2' | '3' | '4',
        );
      }
    }
    return frames;
  }

  function readId3(buffer: ArrayBuffer): MetadataTags | null {
    if (!buffer || buffer.byteLength < 10) return null;
    try {
      const data = new DataView(buffer);
      if (stringAt(data, 0, 3) !== 'ID3') return null;
      const major = data.getUint8(3);
      if (major < 2 || major > 4) return null;
      const unsynchronised = bit(data, 5, 7);
      const extendedHeader = bit(data, 5, 6);
      const end = 10 + synchsafe(data, 6);
      if (end > data.byteLength) return null;
      let offset = 10;
      if (extendedHeader) {
        if (offset + 4 > end) return null;
        offset += data.getInt32(offset, true) + 4;
        if (offset > end) return null;
      }
      const frames = unsynchronised ? {} : readFrames(data, offset, end, major);
      const tags: MetadataTags = {};
      for (const [name, ids] of Object.entries(SHORTCUTS)) {
        const value = ids.map((id) => frames[id]).find((frame) => frame !== undefined);
        if (value) tags[name] = value;
      }
      return tags;
    } catch {
      return null;
    }
  }

  function ascii(value: string) {
    return Array.from(value, (character) => character.charCodeAt(0) & 0xff);
  }

  function uint32Bytes(value: number) {
    return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
  }

  function synchsafeBytes(value: number) {
    return [(value >>> 21) & 0x7f, (value >>> 14) & 0x7f, (value >>> 7) & 0x7f, value & 0x7f];
  }

  function utf16Le(value: unknown, bom: boolean) {
    const string = String(value ?? '');
    const bytes = bom ? [0xff, 0xfe] : [];
    for (let index = 0; index < string.length; index += 1) {
      const code = string.charCodeAt(index);
      bytes.push(code & 0xff, code >> 8);
    }
    return bytes;
  }

  function frame(id: string, payload: number[]) {
    return payload.length ? [...ascii(id), ...uint32Bytes(payload.length), 0, 0, ...payload] : [];
  }

  function textFrame(value: unknown) {
    const text = String(value ?? '');
    return text ? [1, ...utf16Le(text, true)] : [];
  }

  function nestedText(value: unknown, key: string) {
    if (value && typeof value === 'object' && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return value ?? '';
  }

  function pictureFrame(picture: Picture | undefined) {
    if (!picture?.data?.length) return [];
    return [
      0,
      ...ascii(picture.format || 'image/jpeg'),
      0,
      picture.type || 3,
      0,
      ...Array.from(picture.data),
    ];
  }

  function existingId3Size(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 10 || stringAt(new DataView(buffer), 0, 3) !== 'ID3') return 0;
    const size = 10 + synchsafe(new DataView(buffer), 6) + (bytes[5]! & 0x10 ? 10 : 0);
    return size > bytes.length ? 0 : size;
  }

  function writeId3(buffer: ArrayBuffer, tags: MetadataTags) {
    const comment = nestedText(tags.comment, 'text');
    const lyrics = nestedText(tags.lyrics, 'lyrics');
    const frames = [
      ...frame('TIT2', textFrame(tags.title)),
      ...frame('TPE1', textFrame(tags.artist)),
      ...frame('TALB', textFrame(tags.album)),
      ...frame('TYER', textFrame(tags.year)),
      ...frame('TCON', textFrame(tags.genre)),
      ...frame('TRCK', textFrame(tags.track)),
      ...frame(
        'COMM',
        comment ? [1, ...ascii('eng'), ...utf16Le('', true), 0, 0, ...utf16Le(comment, true)] : [],
      ),
      ...frame(
        'USLT',
        lyrics ? [1, ...ascii('eng'), ...utf16Le('', true), 0, 0, ...utf16Le(lyrics, true)] : [],
      ),
      ...frame('APIC', pictureFrame(tags.picture)),
    ];
    const header = [...ascii('ID3'), 3, 0, 0, ...synchsafeBytes(frames.length)];
    const audio = new Uint8Array(buffer, existingId3Size(buffer));
    const output = new Uint8Array(header.length + frames.length + audio.length);
    output.set(header);
    output.set(frames, header.length);
    output.set(audio, header.length + frames.length);
    return output.buffer;
  }

  const MP4_TYPES: Mp4Api['types'] = {
    '0': 'uint8',
    '1': 'text',
    '13': 'jpeg',
    '14': 'png',
    '21': 'uint8',
  };
  const MP4_ATOMS: Mp4Api['atom'] = {
    aART: ['artist'],
    covr: ['picture'],
    trkn: ['track'],
    '©ART': ['artist'],
    '©alb': ['album'],
    '©art': ['artist'],
    '©cmt': ['comment'],
    '©day': ['year'],
    '©gen': ['genre'],
    '©lyr': ['lyrics'],
    '©nam': ['title'],
  };

  function readAtoms(tags: MetadataTags, data: DataView, offset: number, length: number) {
    let seek = offset;
    const end = Math.min(offset + length, data.byteLength);
    while (seek + 8 <= end) {
      const atomSize = data.getInt32(seek);
      if (atomSize === 0 || atomSize < 8 || seek + atomSize > end) return;
      const atomName = stringAt(data, seek + 4, 4);
      if (atomName === 'meta') {
        readAtoms(tags, data, seek + 12, atomSize - 12);
      } else if (atomName === 'moov' || atomName === 'udta' || atomName === 'ilst') {
        readAtoms(tags, data, seek + 8, atomSize - 8);
      } else {
        const mapping = MP4_ATOMS[atomName];
        if (mapping) {
          if (seek + 24 > end) return;
          if (atomName === 'trkn') {
            if (seek + 30 > end) return;
            tags[mapping[0]] = data.getUint8(seek + 27);
            tags.count = data.getUint8(seek + 29);
          } else {
            const type = MP4_TYPES[String(uint24(data, seek + 17, true))];
            const payloadOffset = seek + 24;
            const payloadLength = atomSize - 24;
            if (payloadLength < 0 || payloadOffset + payloadLength > end) return;
            let value: unknown;
            if (type === 'text') {
              value = decodedStringAt(data, payloadOffset, payloadLength, 'utf-8').value;
            } else if (type === 'uint8') {
              value = uint16(data, payloadOffset, false);
            } else if (type === 'jpeg' || type === 'png') {
              value = {
                data: bytesAt(data, payloadOffset, payloadLength),
                format: `image/${type}`,
              };
            }
            tags[mapping[0]] = mapping[0] === 'comment' ? { text: String(value ?? '') } : value;
          }
        }
      }
      seek += atomSize;
    }
  }

  function readMp4(buffer: ArrayBuffer): MetadataTags | null {
    if (!buffer || buffer.byteLength < 8) return null;
    try {
      const tags: MetadataTags = {};
      readAtoms(tags, new DataView(buffer), 0, buffer.byteLength);
      return tags;
    } catch {
      return null;
    }
  }

  const id3: Id3Api = { ReadTags: readId3, WriteTags: writeId3, readFrameData: frameReaders };
  const mp4: Mp4Api = { ReadTags: readMp4, atom: MP4_ATOMS, types: MP4_TYPES };
  const service: MetadataService = {
    id3,
    mp4,
    read(buffer) {
      const bytes = new Uint8Array(buffer);
      if (bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) return readId3(buffer);
      if (
        bytes[4] === 102 &&
        bytes[5] === 116 &&
        bytes[6] === 121 &&
        bytes[7] === 112 &&
        bytes[8] === 77 &&
        bytes[9] === 52
      ) {
        return readMp4(buffer);
      }
      return null;
    },
    readId3,
    readMp4,
    writeId3,
  };

  const runtime = window as RuntimeWindow;
  runtime.AMMetadataService = service;
  runtime.ID3v2 = id3;
  runtime.ID4 = mp4;
})();
