import { parseAudioProject, type AudioProject } from '@audiomass/audio-engine';

import { indexedDbRequest, indexedDbTransaction } from './indexed-db';

export interface StoredAudioProject {
  project: AudioProject;
  updatedAt: string;
}

export interface AudioProjectRepository {
  delete(projectId: string): Promise<void>;
  get(projectId: string): Promise<StoredAudioProject | null>;
  list(): Promise<readonly StoredAudioProject[]>;
  save(project: AudioProject): Promise<StoredAudioProject>;
}

interface ProjectRecord {
  id: string;
  project: unknown;
  updatedAt: string;
}

const DATABASE_NAME = 'audiomass-editor';
const DATABASE_VERSION = 1;
const PROJECT_STORE = 'projects';

function parseRecord(value: unknown): StoredAudioProject {
  if (!value || typeof value !== 'object') throw new TypeError('Stored project is invalid.');
  const record = value as Partial<ProjectRecord>;
  if (typeof record.updatedAt !== 'string') throw new TypeError('Stored project date is invalid.');
  return { project: parseAudioProject(record.project), updatedAt: record.updatedAt };
}

export class IndexedDbAudioProjectRepository implements AudioProjectRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  public constructor(private readonly indexedDb: IDBFactory = globalThis.indexedDB) {}

  public async get(projectId: string): Promise<StoredAudioProject | null> {
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readonly');
    const value = await indexedDbRequest(transaction.objectStore(PROJECT_STORE).get(projectId));
    await indexedDbTransaction(transaction);
    return value === undefined ? null : parseRecord(value);
  }

  public async list(): Promise<readonly StoredAudioProject[]> {
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readonly');
    const values = await indexedDbRequest(transaction.objectStore(PROJECT_STORE).getAll());
    await indexedDbTransaction(transaction);
    return values
      .map(parseRecord)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public async save(project: AudioProject): Promise<StoredAudioProject> {
    const stored = {
      project: parseAudioProject({ format: 'audiomass-project', project, version: 1 }),
      updatedAt: new Date().toISOString(),
    };
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    transaction
      .objectStore(PROJECT_STORE)
      .put({ id: project.id, ...stored } satisfies ProjectRecord);
    await indexedDbTransaction(transaction);
    return stored;
  }

  public async delete(projectId: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(PROJECT_STORE, 'readwrite');
    transaction.objectStore(PROJECT_STORE).delete(projectId);
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
          if (!request.result.objectStoreNames.contains(PROJECT_STORE)) {
            request.result.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
          }
        },
        { once: true },
      );
      request.addEventListener('success', () => resolve(request.result), { once: true });
      request.addEventListener(
        'error',
        () => reject(request.error ?? new Error('Could not open the AudioMass project database.')),
        { once: true },
      );
    });
    return this.databasePromise;
  }
}
