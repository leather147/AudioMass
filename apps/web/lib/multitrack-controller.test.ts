import {
  createAudioProject,
  type ExportedAudioFile,
  type MultitrackSessionDocument,
  type MultitrackSessionSnapshot,
  type MultitrackSourceInput,
  type PcmAudio,
  type WavBitDepth,
} from '@audiomass/audio-engine';
import { describe, expect, it } from 'vitest';

import { MultitrackController } from '@/features/editor/application/multitrack-controller';

class FakeSession {
  readonly added: MultitrackSourceInput[] = [];
  bounced: PcmAudio | null = {
    channels: [Float32Array.from([0, 0.5]), Float32Array.from([0, 0.5])],
    sampleRate: 2,
  };
  closed = false;
  loadedDocument: MultitrackSessionDocument | null = null;
  snapshot: MultitrackSessionSnapshot = {
    crossfades: [],
    mixer: { masterGain: 1 },
    project: createAudioProject({ id: 'project', name: 'Native mix' }),
    transport: { duration: 0, position: 0, sampleRate: null, state: 'idle' },
  };

  addSource(input: MultitrackSourceInput): void {
    this.added.push(input);
  }

  bounce(): PcmAudio | null {
    return this.bounced;
  }

  createDocument(): MultitrackSessionDocument {
    return { ...this.snapshot, sources: [] };
  }

  loadDocument(document: MultitrackSessionDocument): void {
    this.loadedDocument = document;
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  on(): () => void {
    return () => undefined;
  }

  pause(): void {}
  async play(): Promise<void> {}
  removeTrack(): void {}
  async seek(): Promise<void> {}
  stop(): void {}
  updateMasterGain(): void {}
  updateTrack(): void {}
}

describe('MultitrackController browser boundary', () => {
  it('decodes multiple files into stable native source, track, and clip records', async () => {
    const session = new FakeSession();
    let decoderClosed = false;
    const savedProjects: string[] = [];
    let storedDocument: MultitrackSessionDocument | null = null;
    const ids = ['one', 'two'];
    const controller = new MultitrackController(
      session as never,
      {
        close: async () => {
          decoderClosed = true;
        },
        decode: async () => ({ channels: [Float32Array.from([1, 0])], sampleRate: 2 }),
      },
      undefined,
      undefined,
      undefined,
      () => ids.shift()!,
      {
        delete: async () => undefined,
        get: async () =>
          storedDocument
            ? { document: storedDocument, updatedAt: '2026-07-30T00:00:00.000Z' }
            : null,
        save: async (document) => {
          storedDocument = document;
          savedProjects.push(document.project.id);
          return { document, updatedAt: '2026-07-30T00:00:00.000Z' };
        },
      },
    );
    const files = ['voice.wav', 'music.mp3'].map(
      (name) => ({ arrayBuffer: async () => new ArrayBuffer(2), name }) as File,
    );

    await controller.addFiles(files);

    expect(session.added).toMatchObject([
      {
        clipId: 'clip-one',
        color: '#43e4dc',
        name: 'voice.wav',
        sourceId: 'source-one',
        trackId: 'track-one',
      },
      {
        clipId: 'clip-two',
        color: '#7aa2f7',
        name: 'music.mp3',
        sourceId: 'source-two',
        trackId: 'track-two',
      },
    ]);
    await controller.saveProject();
    expect(savedProjects).toEqual(['project']);
    await controller.restoreProject();
    expect(session.loadedDocument).toBe(storedDocument);
    await controller.close();
    expect(session.closed).toBe(true);
    expect(decoderClosed).toBe(true);
  });

  it('exports the session bounce through the worker and browser download ports', async () => {
    const session = new FakeSession();
    const downloads: ExportedAudioFile[] = [];
    let depth: WavBitDepth | null = null;
    let destroyed = false;
    const controller = new MultitrackController(
      session as never,
      { close: async () => undefined, decode: async () => session.bounced! },
      undefined,
      { save: (file) => downloads.push(file) },
      () => ({
        destroy: () => {
          destroyed = true;
        },
        encode: async (_audio, bitDepth) => {
          depth = bitDepth;
          return Uint8Array.from([1, 2]).buffer;
        },
      }),
    );

    await controller.downloadWav(24);

    expect(depth).toBe(24);
    expect(downloads[0]).toMatchObject({ fileName: 'Native mix.wav', mimeType: 'audio/wav' });
    expect(destroyed).toBe(true);
    await controller.close();
  });
});
