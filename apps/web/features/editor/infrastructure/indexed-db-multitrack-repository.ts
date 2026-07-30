import {
  createMixerState,
  InMemoryAudioSourceRepository,
  normalizeCrossfades,
  parseAudioProject,
  type AudioCrossfade,
  type MultitrackSessionDocument,
  type MultitrackStoredSource,
  type PcmAudio,
} from '@audiomass/audio-engine';

import { indexedDbRequest, indexedDbTransaction } from './indexed-db';

export interface StoredMultitrackDocument {
  document: MultitrackSessionDocument;
  updatedAt: string;
}

export interface MultitrackProjectRepository {
  close?(): void;
  delete(projectId: string): Promise<void>;
  get(projectId: string): Promise<StoredMultitrackDocument | null>;
  save(document: MultitrackSessionDocument): Promise<StoredMultitrackDocument>;
}

interface MultitrackRecord {
  document: unknown;
  id: string;
  updatedAt: string;
}

const DATABASE_NAME = 'audiomass-native-multitrack';
const DATABASE_VERSION = 1;
const DOCUMENT_STORE = 'documents';

function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
  return value as Record<string, unknown>;
}

function parseAudio(value: unknown): PcmAudio {
  const audio = record(value, 'Stored PCM audio is invalid.');
  if (typeof audio.sampleRate !== 'number' || !Array.isArray(audio.channels)) {
    throw new TypeError('Stored PCM audio is invalid.');
  }
  return {
    channels: audio.channels.map((channel) => {
      if (!Array.isArray(channel) && !ArrayBuffer.isView(channel)) {
        throw new TypeError('Stored PCM channel is invalid.');
      }
      return Float32Array.from(channel as ArrayLike<number>);
    }),
    sampleRate: audio.sampleRate,
  };
}

function parseSource(value: unknown): MultitrackStoredSource {
  const source = record(value, 'Stored multitrack source is invalid.');
  if (typeof source.sourceId !== 'string' || !source.sourceId.trim()) {
    throw new TypeError('Stored multitrack source id is invalid.');
  }
  const repository = new InMemoryAudioSourceRepository();
  repository.set(source.sourceId, parseAudio(source.audio));
  return { audio: repository.get(source.sourceId)!, sourceId: source.sourceId };
}

function parseCrossfade(value: unknown): AudioCrossfade {
  const crossfade = record(value, 'Stored crossfade is invalid.');
  if (typeof crossfade.firstClipId !== 'string' || typeof crossfade.secondClipId !== 'string') {
    throw new TypeError('Stored crossfade is invalid.');
  }
  return { firstClipId: crossfade.firstClipId, secondClipId: crossfade.secondClipId };
}

function parseStoredRecord(value: unknown): StoredMultitrackDocument {
  const stored = record(value, 'Stored multitrack document is invalid.');
  if (typeof stored.updatedAt !== 'string') throw new TypeError('Stored project date is invalid.');
  const input = record(stored.document, 'Stored multitrack document is invalid.');
  const project = parseAudioProject({
    format: 'audiomass-project',
    project: input.project,
    version: 1,
  });
  const mixer = record(input.mixer, 'Stored mixer is invalid.');
  if (
    typeof mixer.masterGain !== 'number' ||
    !Number.isFinite(mixer.masterGain) ||
    mixer.masterGain < 0 ||
    mixer.masterGain > 1
  ) {
    throw new TypeError('Stored master gain is invalid.');
  }
  if (!Array.isArray(input.sources) || !Array.isArray(input.crossfades)) {
    throw new TypeError('Stored multitrack sources and crossfades must be arrays.');
  }
  const sources = input.sources.map(parseSource);
  const sourceIds = new Set(sources.map((source) => source.sourceId));
  if (sourceIds.size !== sources.length)
    throw new TypeError('Stored audio source ids must be unique.');
  for (const sourceId of project.tracks.flatMap((track) =>
    track.clips.map((clip) => clip.sourceId),
  )) {
    if (!sourceIds.has(sourceId))
      throw new TypeError(`Stored audio source ${sourceId} is missing.`);
  }
  const crossfades = normalizeCrossfades(project, input.crossfades.map(parseCrossfade));
  return {
    document: {
      crossfades,
      mixer: createMixerState(mixer.masterGain),
      project,
      sources,
    },
    updatedAt: stored.updatedAt,
  };
}

export class IndexedDbMultitrackProjectRepository implements MultitrackProjectRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  public constructor(private readonly indexedDb: IDBFactory = globalThis.indexedDB) {}

  public async get(projectId: string): Promise<StoredMultitrackDocument | null> {
    const database = await this.database();
    const transaction = database.transaction(DOCUMENT_STORE, 'readonly');
    const value = await indexedDbRequest(transaction.objectStore(DOCUMENT_STORE).get(projectId));
    await indexedDbTransaction(transaction);
    return value === undefined ? null : parseStoredRecord(value);
  }

  public async save(document: MultitrackSessionDocument): Promise<StoredMultitrackDocument> {
    const stored = { document, updatedAt: new Date().toISOString() };
    const database = await this.database();
    const transaction = database.transaction(DOCUMENT_STORE, 'readwrite');
    transaction
      .objectStore(DOCUMENT_STORE)
      .put({ id: document.project.id, ...stored } satisfies MultitrackRecord);
    await indexedDbTransaction(transaction);
    return parseStoredRecord({ id: document.project.id, ...stored });
  }

  public async delete(projectId: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(DOCUMENT_STORE, 'readwrite');
    transaction.objectStore(DOCUMENT_STORE).delete(projectId);
    await indexedDbTransaction(transaction);
  }

  public close(): void {
    void this.databasePromise?.then((database) => database.close());
    this.databasePromise = null;
  }

  private database(): Promise<IDBDatabase> {
    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = this.indexedDb.open(DATABASE_NAME, DATABASE_VERSION);
      request.addEventListener(
        'upgradeneeded',
        () => {
          if (!request.result.objectStoreNames.contains(DOCUMENT_STORE)) {
            request.result.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
          }
        },
        { once: true },
      );
      request.addEventListener('success', () => resolve(request.result), { once: true });
      request.addEventListener(
        'error',
        () => reject(request.error ?? new Error('Could not open the multitrack database.')),
        { once: true },
      );
    });
    return this.databasePromise;
  }
}
