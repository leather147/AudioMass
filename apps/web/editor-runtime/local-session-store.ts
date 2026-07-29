(() => {
  const DATABASE_NAME = 'audiomass';
  const DATABASE_VERSION = 1;
  const STORE_NAME = 'sessions';
  const COMPRESSION = 'l4z';

  type AudioBufferLike = {
    duration: number;
    getChannelData(channel: number): Float32Array;
    numberOfChannels: number;
    sampleRate: number;
  };

  type SessionId = IDBValidKey;
  type SessionRecord = {
    chans: number;
    comp: string;
    created: number;
    data: ArrayBuffer[];
    data2: number[];
    durr: number;
    id: SessionId;
    markers: unknown[];
    name: string;
    samplerate: number;
    thumb: unknown;
  };

  type EditorApp = {
    engine: { GetWave(buffer: AudioBufferLike): unknown };
    fireEvent(name: string, ...arguments_: unknown[]): void;
    mrk?: { serEd(): unknown[] };
  };

  type Lz4Instance = {
    decodeBlock(input: ArrayBuffer, offset: number, size: number): Uint8Array;
    encodeBlock(input: ArrayBuffer, offset: number): Uint8Array;
  };

  type LegacySessionStore = {
    on: boolean;
    DelSession(id: SessionId, callback?: (id: SessionId) => void): void;
    GetSession(id: SessionId, callback?: (record: SessionRecord | undefined) => void): void;
    Init(callback?: (error?: 'err') => void): void;
    ListSessions(callback?: (records: SessionRecord[]) => void): void;
    SaveSession(
      buffer: AudioBufferLike,
      id: SessionId,
      name: string,
      callback?: (record: SessionRecord, event: Event) => void,
      quiet?: boolean,
    ): void;
  };

  type RuntimeWindow = typeof window & {
    AMLocalSessionStore?: new (app: EditorApp) => LegacySessionStore;
    PKAudioEditor: {
      _deps: { fls?: new (app: EditorApp) => LegacySessionStore };
    };
    lz4BlockCodec?: {
      createInstance(flavor: 'wasm'): Promise<Lz4Instance | null>;
    };
  };

  function ownedBuffer(input: ArrayBuffer | Uint8Array) {
    const view = input instanceof Uint8Array ? input : new Uint8Array(input);
    const copy = new Uint8Array(view.byteLength);
    copy.set(view);
    return copy.buffer;
  }

  class CompressionService {
    private instancePromise?: Promise<Lz4Instance | null>;

    constructor(private readonly runtime: RuntimeWindow) {}

    private instance() {
      this.instancePromise ??= this.runtime.lz4BlockCodec
        ? this.runtime.lz4BlockCodec.createInstance('wasm').catch(() => null)
        : Promise.resolve(null);
      return this.instancePromise;
    }

    async compress(input: ArrayBuffer) {
      const codec = await this.instance();
      return ownedBuffer(codec ? codec.encodeBlock(input, 0) : input);
    }

    async decompress(input: ArrayBuffer, size: number) {
      const codec = await this.instance();
      return ownedBuffer(codec ? codec.decodeBlock(input, 0, size) : input);
    }
  }

  class IndexedDbSessionRepository {
    private databasePromise?: Promise<IDBDatabase>;

    constructor(private readonly indexedDb: IDBFactory) {}

    open() {
      this.databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
        const request = this.indexedDb.open(DATABASE_NAME, DATABASE_VERSION);
        request.onerror = () => reject(request.error ?? new Error('Unable to open database.'));
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          database.onerror = (event) => console.error(event);
          resolve(database);
        };
      });
      return this.databasePromise;
    }

    async add(record: SessionRecord) {
      const database = await this.open();
      return new Promise<Event>((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const request = transaction.objectStore(STORE_NAME).add(record);
        request.onerror = () => reject(request.error ?? new Error('Unable to store session.'));
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('Unable to store session.'));
        transaction.oncomplete = (event) => resolve(event);
      });
    }

    async get(id: SessionId) {
      const database = await this.open();
      return new Promise<SessionRecord | undefined>((resolve, reject) => {
        const request = database
          .transaction([STORE_NAME], 'readonly')
          .objectStore(STORE_NAME)
          .get(id);
        request.onerror = () => reject(request.error ?? new Error('Unable to read session.'));
        request.onsuccess = () => resolve(request.result as SessionRecord | undefined);
      });
    }

    async delete(id: SessionId) {
      const database = await this.open();
      return new Promise<void>((resolve, reject) => {
        const request = database
          .transaction([STORE_NAME], 'readwrite')
          .objectStore(STORE_NAME)
          .delete(id);
        request.onerror = () => reject(request.error ?? new Error('Unable to delete session.'));
        request.onsuccess = () => resolve();
      });
    }

    async list() {
      const database = await this.open();
      return new Promise<SessionRecord[]>((resolve, reject) => {
        const records: SessionRecord[] = [];
        const request = database
          .transaction([STORE_NAME], 'readonly')
          .objectStore(STORE_NAME)
          .openCursor();
        request.onerror = () => reject(request.error ?? new Error('Unable to list sessions.'));
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            records.push(cursor.value as SessionRecord);
            cursor.continue();
            return;
          }
          resolve(records.sort((left, right) => right.created - left.created));
        };
      });
    }
  }

  const runtime = window as RuntimeWindow;

  class LocalSessionStore implements LegacySessionStore {
    on = false;
    private readonly compression = new CompressionService(runtime);
    private readonly repository?: IndexedDbSessionRepository;
    private initialization?: Promise<void>;

    constructor(private readonly app: EditorApp) {
      if (runtime.indexedDB) {
        this.repository = new IndexedDbSessionRepository(runtime.indexedDB);
      }
    }

    Init(callback?: (error?: 'err') => void) {
      if (this.on) {
        callback?.();
        return;
      }
      if (!this.repository) {
        callback?.('err');
        return;
      }

      this.initialization ??= this.repository
        .open()
        .then(
          () =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                this.on = true;
                this.app.fireEvent('DidOpenDB', this);
                resolve();
              }, 120);
            }),
        )
        .catch((error: unknown) => {
          this.initialization = undefined;
          throw error;
        });
      void this.initialization.then(
        () => callback?.(),
        () => callback?.('err'),
      );
    }

    SaveSession(
      buffer: AudioBufferLike,
      id: SessionId,
      name: string,
      callback?: (record: SessionRecord, event: Event) => void,
      quiet?: boolean,
    ) {
      void this.save(buffer, id, name).then(
        ({ event, record }) => {
          if (!quiet) this.app.fireEvent('DidStoreDB', record, event);
          callback?.(record, event);
        },
        (error: unknown) => {
          this.app.fireEvent('ErrorDB', error);
          console.error('Error storing session data.', error);
        },
      );
    }

    private async save(buffer: AudioBufferLike, id: SessionId, name: string) {
      if (!this.repository) throw new Error('IndexedDB is not available.');
      const data: ArrayBuffer[] = [];
      const originalSizes: number[] = [];
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const samples = buffer.getChannelData(channel);
        originalSizes.push(samples.buffer.byteLength);
        data.push(await this.compression.compress(samples.buffer as ArrayBuffer));
      }
      const record: SessionRecord = {
        chans: buffer.numberOfChannels,
        comp: COMPRESSION,
        created: Date.now(),
        data,
        data2: originalSizes,
        durr: Number(buffer.duration.toFixed(3)),
        id,
        markers: this.app.mrk?.serEd() ?? [],
        name,
        samplerate: buffer.sampleRate,
        thumb: this.app.engine.GetWave(buffer),
      };
      const event = await this.repository.add(record);
      return { event, record };
    }

    GetSession(id: SessionId, callback?: (record: SessionRecord | undefined) => void) {
      void this.get(id).then(
        (record) => callback?.(record),
        (error: unknown) => {
          this.app.fireEvent('ErrorDB', error);
          callback?.(undefined);
        },
      );
    }

    private async get(id: SessionId) {
      if (!this.repository) throw new Error('IndexedDB is not available.');
      const record = await this.repository.get(id);
      if (!record?.comp) return record;
      record.data = await Promise.all(
        record.data.map((channel, index) =>
          this.compression.decompress(channel, record.data2[index] ?? channel.byteLength),
        ),
      );
      return record;
    }

    DelSession(id: SessionId, callback?: (id: SessionId) => void) {
      if (!this.repository) return;
      void this.repository.delete(id).then(
        () => callback?.(id),
        (error: unknown) => this.app.fireEvent('ErrorDB', error),
      );
    }

    ListSessions(callback?: (records: SessionRecord[]) => void) {
      if (!this.repository) {
        callback?.([]);
        return;
      }
      void this.repository.list().then(
        (records) => callback?.(records),
        (error: unknown) => {
          console.error('Error fetching session data.', error);
          this.app.fireEvent('ErrorDB', error);
          callback?.([]);
        },
      );
    }
  }

  runtime.AMLocalSessionStore = LocalSessionStore;
  runtime.PKAudioEditor._deps.fls = LocalSessionStore;
})();
