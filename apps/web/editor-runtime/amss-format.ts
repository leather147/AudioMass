(() => {
  const MIME_TYPE = 'application/x-audiomass-session';
  const NONE_INDEX = 65_535;
  const MAX_ITEMS = 65_534;

  type AudioBufferLike = {
    getChannelData(channel: number): Float32Array;
    length: number;
    numberOfChannels: number;
    sampleRate: number;
  };

  type AudioContextLike = {
    createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike;
  };

  type ProjectTrack = {
    h?: number;
    id: string;
    mute?: boolean;
    name?: string;
    pan?: number;
    rec?: boolean;
    solo?: boolean;
    vol?: number;
  };

  type ProjectClip = {
    buffer: AudioBufferLike;
    fi?: number;
    fo?: number;
    id: string;
    in?: number;
    name?: string;
    out: number;
    start: number;
    track: string;
  };

  type MultitrackProject = {
    beat_bpm?: number;
    beat_sig?: string;
    clip_uid?: number;
    clips?: ProjectClip[];
    cursor?: number;
    marker?: number;
    markers?: unknown[];
    master_vol?: number;
    px_per_sec?: number;
    row_h?: number;
    selected_clip?: string | null;
    selected_track?: string | null;
    track_uid?: number;
    tracks?: ProjectTrack[];
    xfades?: Record<string, unknown>;
  };

  type DecodedProject = MultitrackProject & {
    beat_bpm: number;
    beat_sig: string;
    clip_uid: number;
    clips: ProjectClip[];
    markers: unknown[];
    selected_clip: string | null;
    selected_track: string | null;
    track_uid: number;
    tracks: ProjectTrack[];
    xfades: Record<string, unknown>;
  };

  type ProjectFormatService = {
    decodeMultitrack(buffer: ArrayBuffer, context: AudioContextLike): DecodedProject | null;
    encodeMultitrack(state: MultitrackProject): Blob | null;
    isBuffer(buffer: ArrayBuffer | null | undefined): boolean;
    isFile(file: Pick<File, 'name'> | null | undefined): boolean;
    normalizeName(name?: string): string;
  };

  type EditorApp = {
    engine: { wavesurfer: { backend: { ac: AudioContextLike } } };
  };

  type LegacyAdapter = {
    DecodeMultitrack(buffer: ArrayBuffer): DecodedProject | null;
    ExportMultitrack(name: string, state: MultitrackProject): boolean;
    IsBuffer(buffer: ArrayBuffer | null | undefined): boolean;
    ReadFile(
      file: File | null | undefined,
      callback: (buffer: ArrayBuffer | null, name: string) => void,
    ): boolean;
  };

  type RuntimeWindow = typeof window & {
    AMProjectFormat?: ProjectFormatService;
    PKAudioEditor: { _deps: { amss?: new (app: EditorApp) => LegacyAdapter } };
    webkitURL?: typeof URL;
  };

  class Writer {
    readonly bytes: number[] = [];
    private readonly buffer = new ArrayBuffer(4);
    private readonly view = new DataView(this.buffer);
    private readonly encodedFloat = new Uint8Array(this.buffer);
    private readonly encoder = new TextEncoder();

    u8(value: number) {
      this.bytes.push(value & 0xff);
    }

    u16(value: number) {
      this.u8(value);
      this.u8(value >> 8);
    }

    f32(value: number | null | undefined) {
      this.view.setFloat32(0, value || 0, true);
      this.bytes.push(...this.encodedFloat);
    }

    str(value: string | null | undefined) {
      const encoded = this.encoder.encode(value || '');
      const length = Math.min(255, encoded.length);
      this.u8(length);
      for (let index = 0; index < length; index += 1) this.u8(encoded[index]!);
    }
  }

  class Reader {
    offset: number;
    private readonly decoder = new TextDecoder();
    private readonly view: DataView;

    constructor(
      private readonly buffer: ArrayBuffer,
      offset: number,
    ) {
      this.offset = offset;
      this.view = new DataView(buffer);
    }

    u8() {
      return this.view.getUint8(this.offset++);
    }

    u16() {
      const value = this.view.getUint16(this.offset, true);
      this.offset += 2;
      return value;
    }

    u32At(offset: number) {
      return this.view.getUint32(offset, true);
    }

    f32() {
      const value = this.view.getFloat32(this.offset, true);
      this.offset += 4;
      return value;
    }

    f32At(offset: number) {
      return this.view.getFloat32(offset, true);
    }

    str() {
      const length = this.u8();
      const value = this.decoder.decode(new Uint8Array(this.buffer, this.offset, length));
      this.offset += length;
      return value;
    }
  }

  function normalizeName(name = 'audiomass-session') {
    const normalized = (name || 'audiomass-session').trim();
    return /\.amss$/i.test(normalized) ? normalized : `${normalized}.amss`;
  }

  function isFile(file: Pick<File, 'name'> | null | undefined) {
    return Boolean(file && /\.amss$/i.test(file.name || ''));
  }

  function isBuffer(buffer: ArrayBuffer | null | undefined) {
    if (!buffer || buffer.byteLength < 4) return false;
    const header = new Uint8Array(buffer, 0, 4);
    return header[0]! > 0 && header[1] === 65 && header[2] === 77 && header[3] === 83;
  }

  function pairKey(left: string, right: string) {
    return left < right ? `${left}:${right}` : `${right}:${left}`;
  }

  function encodeMultitrack(state: MultitrackProject): Blob | null {
    const writer = new Writer();
    const tracks = state.tracks ?? [];
    const clips = state.clips ?? [];
    const audio: Array<{ buffer: AudioBufferLike; name: string }> = [];
    const trackMap = new Map<string, number>();
    const clipMap = new Map<string, number>();
    const crossfades: Array<[number, number]> = [];

    const audioIndex = (buffer: AudioBufferLike, name?: string) => {
      const existing = audio.findIndex((entry) => entry.buffer === buffer);
      if (existing >= 0) return existing;
      audio.push({ buffer, name: name || 'Audio' });
      return audio.length - 1;
    };

    tracks.forEach((track, index) => trackMap.set(track.id, index));
    for (let index = 0; index < clips.length; index += 1) {
      const clip = clips[index]!;
      if (!clip.buffer || !trackMap.has(clip.track)) return null;
      clipMap.set(clip.id, index);
      audioIndex(clip.buffer, clip.name);
    }
    for (const key of Object.keys(state.xfades ?? {})) {
      const [leftId, rightId] = key.split(':');
      const left = leftId ? clipMap.get(leftId) : undefined;
      const right = rightId ? clipMap.get(rightId) : undefined;
      if (left !== undefined && right !== undefined) crossfades.push([left, right]);
    }
    if ([tracks.length, clips.length, audio.length, crossfades.length].some((n) => n > MAX_ITEMS)) {
      return null;
    }

    [1, 65, 77, 83, 0].forEach((value) => writer.u8(value));
    [tracks.length, clips.length, audio.length, crossfades.length].forEach((value) =>
      writer.u16(value),
    );
    writer.u16(
      state.selected_track && trackMap.has(state.selected_track)
        ? trackMap.get(state.selected_track)!
        : NONE_INDEX,
    );
    writer.u16(
      state.selected_clip && clipMap.has(state.selected_clip)
        ? clipMap.get(state.selected_clip)!
        : NONE_INDEX,
    );
    writer.f32(state.cursor);
    writer.f32(state.marker);
    writer.f32(state.px_per_sec);
    writer.f32(state.row_h);
    writer.f32(state.master_vol);

    for (const track of tracks) {
      writer.u8((track.mute ? 1 : 0) | (track.solo ? 2 : 0) | (track.rec ? 4 : 0));
      writer.f32(track.vol === undefined ? 1 : track.vol);
      writer.f32(track.pan);
      writer.f32(track.h || 1);
      writer.str(track.name);
    }
    for (const entry of audio) {
      writer.u8(entry.buffer.numberOfChannels);
      writer.u16(entry.buffer.sampleRate & 0xffff);
      writer.u16(entry.buffer.sampleRate / 65_536);
      writer.u16(entry.buffer.length & 0xffff);
      writer.u16(entry.buffer.length / 65_536);
      writer.str(entry.name);
    }
    for (const clip of clips) {
      writer.u16(trackMap.get(clip.track)!);
      writer.u16(audioIndex(clip.buffer, clip.name));
      writer.f32(clip.start);
      writer.f32(clip.in);
      writer.f32(clip.out);
      writer.f32(clip.fi);
      writer.f32(clip.fo);
      writer.str(clip.name);
    }
    for (const crossfade of crossfades) {
      writer.u16(crossfade[0]);
      writer.u16(crossfade[1]);
    }
    while (writer.bytes.length & 3) writer.u8(0);

    const parts: BlobPart[] = [new Uint8Array(writer.bytes)];
    for (const entry of audio) {
      for (let channel = 0; channel < entry.buffer.numberOfChannels; channel += 1) {
        parts.push(entry.buffer.getChannelData(channel).slice());
      }
    }
    const bpm = new ArrayBuffer(8);
    new Uint8Array(bpm).set([66, 80, 77]);
    new DataView(bpm).setFloat32(
      4,
      state.beat_bpm && state.beat_bpm > 0 ? state.beat_bpm : 120,
      true,
    );
    parts.push(bpm);

    const signature = new ArrayBuffer(8);
    const signatureBytes = new Uint8Array(signature);
    const signatureParts = (state.beat_sig || '4/4').split('/');
    signatureBytes.set([83, 73, 71]);
    signatureBytes[4] = Number(signatureParts[0]) || 4;
    signatureBytes[5] = Number(signatureParts[1]) || 4;
    parts.push(signature);

    if (state.markers?.length) {
      const markers = new TextEncoder().encode(JSON.stringify(state.markers));
      const markerHeader = new ArrayBuffer(8);
      new Uint8Array(markerHeader).set([77, 82, 75]);
      new DataView(markerHeader).setUint32(4, markers.length, true);
      parts.push(markerHeader, markers);
      if (markers.length & 3) parts.push(new Uint8Array(4 - (markers.length & 3)));
    }
    return new Blob(parts, { type: MIME_TYPE });
  }

  function decodeMultitrack(buffer: ArrayBuffer, context: AudioContextLike): DecodedProject | null {
    if (!isBuffer(buffer)) return null;
    try {
      if (new DataView(buffer).getUint8(0) !== 1) return null;
      const reader = new Reader(buffer, 4);
      reader.u8();
      const trackCount = reader.u16();
      const clipCount = reader.u16();
      const audioCount = reader.u16();
      const crossfadeCount = reader.u16();
      const selectedTrack = reader.u16();
      const selectedClip = reader.u16();
      const state: DecodedProject = {
        beat_bpm: 120,
        beat_sig: '4/4',
        clip_uid: clipCount + 1,
        clips: [],
        cursor: reader.f32(),
        marker: reader.f32(),
        px_per_sec: reader.f32(),
        row_h: reader.f32(),
        master_vol: reader.f32(),
        markers: [],
        selected_clip: null,
        selected_track: null,
        track_uid: trackCount + 1,
        tracks: [],
        xfades: {},
      };
      for (let index = 0; index < trackCount; index += 1) {
        const flags = reader.u8();
        state.tracks.push({
          id: `mt${index + 1}`,
          mute: Boolean(flags & 1),
          solo: Boolean(flags & 2),
          rec: Boolean(flags & 4),
          vol: reader.f32(),
          pan: reader.f32(),
          h: reader.f32(),
          name: reader.str(),
        });
      }
      const audio: Array<{
        buffer?: AudioBufferLike;
        channels: number;
        length: number;
        name: string;
        sampleRate: number;
      }> = [];
      for (let index = 0; index < audioCount; index += 1) {
        audio.push({
          channels: reader.u8(),
          sampleRate: reader.u16() + reader.u16() * 65_536,
          length: reader.u16() + reader.u16() * 65_536,
          name: reader.str(),
        });
      }
      const rawClips: Array<{
        audio: number;
        fadeIn: number;
        fadeOut: number;
        input: number;
        name: string;
        output: number;
        start: number;
        track: number;
      }> = [];
      for (let index = 0; index < clipCount; index += 1) {
        rawClips.push({
          track: reader.u16(),
          audio: reader.u16(),
          start: reader.f32(),
          input: reader.f32(),
          output: reader.f32(),
          fadeIn: reader.f32(),
          fadeOut: reader.f32(),
          name: reader.str(),
        });
      }
      const rawCrossfades: Array<[number, number]> = [];
      for (let index = 0; index < crossfadeCount; index += 1) {
        rawCrossfades.push([reader.u16(), reader.u16()]);
      }

      let requiredBytes = (reader.offset + 3) & ~3;
      for (const entry of audio) {
        if (!entry.channels || entry.channels > 32 || !entry.sampleRate || !entry.length)
          return null;
        requiredBytes += entry.channels * entry.length * 4;
      }
      if (requiredBytes > buffer.byteLength) return null;
      reader.offset = (reader.offset + 3) & ~3;
      for (const entry of audio) {
        entry.buffer = context.createBuffer(entry.channels, entry.length, entry.sampleRate);
        for (let channel = 0; channel < entry.channels; channel += 1) {
          entry.buffer
            .getChannelData(channel)
            .set(new Float32Array(buffer, reader.offset, entry.length));
          reader.offset += entry.length * 4;
        }
      }

      while (buffer.byteLength >= reader.offset + 8) {
        const header = new Uint8Array(buffer, reader.offset, 4);
        if (header[3] === 0 && header[0] === 66 && header[1] === 80 && header[2] === 77) {
          state.beat_bpm = reader.f32At(reader.offset + 4) || 120;
        } else if (header[3] === 0 && header[0] === 83 && header[1] === 73 && header[2] === 71) {
          const view = new DataView(buffer);
          state.beat_sig = `${view.getUint8(reader.offset + 4) || 4}/${view.getUint8(reader.offset + 5) || 4}`;
        } else if (header[3] === 0 && header[0] === 77 && header[1] === 82 && header[2] === 75) {
          const length = reader.u32At(reader.offset + 4);
          if (length > 65_536 || reader.offset + 8 + length > buffer.byteLength) break;
          try {
            const parsed: unknown = JSON.parse(
              new TextDecoder().decode(new Uint8Array(buffer, reader.offset + 8, length)),
            );
            state.markers = Array.isArray(parsed) && parsed.length ? parsed : [];
          } catch {
            state.markers = [];
          }
          reader.offset = (reader.offset + 8 + length + 3) & ~3;
          continue;
        }
        reader.offset += 8;
      }

      rawClips.forEach((clip, index) => {
        const track = state.tracks[clip.track];
        const source = audio[clip.audio];
        if (!track || !source?.buffer) throw new Error('Invalid AMSS clip reference.');
        state.clips.push({
          id: `mc${index + 1}`,
          track: track.id,
          start: clip.start,
          in: clip.input,
          out: clip.output,
          fi: clip.fadeIn || 0,
          fo: clip.fadeOut || 0,
          name: clip.name || source.name,
          buffer: source.buffer,
        });
      });
      for (const [left, right] of rawCrossfades) {
        state.xfades[pairKey(`mc${left + 1}`, `mc${right + 1}`)] = 1;
      }
      state.selected_track =
        (selectedTrack !== NONE_INDEX ? state.tracks[selectedTrack]?.id : undefined) ??
        state.tracks[0]?.id ??
        null;
      state.selected_clip =
        (selectedClip !== NONE_INDEX ? state.clips[selectedClip]?.id : undefined) ?? null;
      return state;
    } catch {
      return null;
    }
  }

  const service: ProjectFormatService = {
    decodeMultitrack,
    encodeMultitrack,
    isBuffer,
    isFile,
    normalizeName,
  };
  const runtime = window as RuntimeWindow;
  runtime.AMProjectFormat = service;

  class AMSSFormatAdapter implements LegacyAdapter {
    constructor(private readonly app: EditorApp) {}

    IsBuffer(buffer: ArrayBuffer | null | undefined) {
      return service.isBuffer(buffer);
    }

    ReadFile(
      file: File | null | undefined,
      callback: (buffer: ArrayBuffer | null, name: string) => void,
    ) {
      if (!file || !service.isFile(file)) return false;
      const reader = new FileReader();
      reader.onload = () =>
        callback(reader.result instanceof ArrayBuffer ? reader.result : null, file.name);
      reader.onerror = () => callback(null, file.name);
      reader.readAsArrayBuffer(file);
      return true;
    }

    ExportMultitrack(name: string, state: MultitrackProject) {
      const blob = service.encodeMultitrack(state);
      if (!blob) return false;
      const urlApi = runtime.URL ?? runtime.webkitURL;
      if (!urlApi) return false;
      const url = urlApi.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = service.normalizeName(name);
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        urlApi.revokeObjectURL(url);
        anchor.parentNode?.removeChild(anchor);
      }, 0);
      return true;
    }

    DecodeMultitrack(buffer: ArrayBuffer) {
      return service.decodeMultitrack(buffer, this.app.engine.wavesurfer.backend.ac);
    }
  }

  runtime.PKAudioEditor._deps.amss = AMSSFormatAdapter;
})();
