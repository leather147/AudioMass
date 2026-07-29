import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

type StoredSession = {
  created: number;
  data: ArrayBuffer[];
  id: IDBValidKey;
  name: string;
};

type FakeRequest<Result> = {
  error?: DOMException | null;
  onerror?: () => void;
  onsuccess?: () => void;
  onupgradeneeded?: () => void;
  result: Result;
};

type FakeCursor = {
  continue(): void;
  primaryKey: IDBValidKey;
  value: StoredSession;
};

type FakeTransaction = {
  error?: DOMException | null;
  oncomplete?: (event: Event) => void;
  onerror?: () => void;
  objectStore(): FakeObjectStore;
};

type FakeObjectStore = {
  add(value: StoredSession): FakeRequest<IDBValidKey>;
  delete(id: IDBValidKey): FakeRequest<undefined>;
  get(id: IDBValidKey): FakeRequest<StoredSession | undefined>;
  openCursor(): FakeRequest<FakeCursor | null>;
};

type AudioBufferLike = {
  duration: number;
  getChannelData(channel: number): Float32Array;
  numberOfChannels: number;
  sampleRate: number;
};

type SessionStore = {
  on: boolean;
  DelSession(id: IDBValidKey, callback: (id: IDBValidKey) => void): void;
  GetSession(id: IDBValidKey, callback: (record: StoredSession | undefined) => void): void;
  Init(callback: (error?: 'err') => void): void;
  ListSessions(callback: (records: StoredSession[]) => void): void;
  SaveSession(
    buffer: AudioBufferLike,
    id: IDBValidKey,
    name: string,
    callback: (record: StoredSession, event: Event) => void,
    quiet?: boolean,
  ): void;
};

type SessionStoreConstructor = new (app: {
  engine: { GetWave(buffer: AudioBufferLike): unknown };
  fireEvent(name: string, ...arguments_: unknown[]): void;
  mrk: { serEd(): unknown[] };
}) => SessionStore;

function request<Result>(result: Result): FakeRequest<Result> {
  return { result };
}

function fakeIndexedDb() {
  const records = new Map<IDBValidKey, StoredSession>();
  let hasStore = false;

  const database = {
    createObjectStore() {
      hasStore = true;
      return {};
    },
    onerror: null,
    objectStoreNames: { contains: () => hasStore },
    transaction() {
      const transaction: FakeTransaction = {
        objectStore() {
          const complete = () =>
            queueMicrotask(() => transaction.oncomplete?.(new Event('complete')));
          return {
            add(value) {
              const operation = request<IDBValidKey>(value.id);
              queueMicrotask(() => {
                if (records.has(value.id)) {
                  operation.onerror?.();
                  return;
                }
                records.set(value.id, structuredClone(value));
                complete();
              });
              return operation;
            },
            delete(id) {
              const operation = request<undefined>(undefined);
              queueMicrotask(() => {
                records.delete(id);
                operation.onsuccess?.();
              });
              return operation;
            },
            get(id) {
              const value = records.get(id);
              const operation = request<StoredSession | undefined>(
                value ? structuredClone(value) : undefined,
              );
              queueMicrotask(() => operation.onsuccess?.());
              return operation;
            },
            openCursor() {
              const values = [...records.values()].map((value) => structuredClone(value));
              const operation = request<FakeCursor | null>(null);
              let index = 0;
              const emit = () => {
                const value = values[index++];
                operation.result = value
                  ? {
                      continue: () => queueMicrotask(emit),
                      primaryKey: value.id,
                      value,
                    }
                  : null;
                operation.onsuccess?.();
              };
              queueMicrotask(emit);
              return operation;
            },
          };
        },
      };
      return transaction;
    },
  };

  const factory = {
    open() {
      const operation = request(database);
      queueMicrotask(() => {
        if (!hasStore) operation.onupgradeneeded?.();
        operation.onsuccess?.();
      });
      return operation;
    },
  };
  return { factory: factory as unknown as IDBFactory, records };
}

function loadSessionStore(indexedDB?: IDBFactory) {
  const source = readFileSync(
    join(process.cwd(), 'public', 'editor-assets', 'local-session-store.js'),
    'utf8',
  );
  let codecInitializations = 0;
  const runtimeWindow = {
    PKAudioEditor: { _deps: {} as { fls?: SessionStoreConstructor } },
    indexedDB,
    lz4BlockCodec: {
      async createInstance() {
        codecInitializations += 1;
        return {
          decodeBlock(input: ArrayBuffer) {
            return Uint8Array.from(new Uint8Array(input)).reverse();
          },
          encodeBlock(input: ArrayBuffer) {
            return Uint8Array.from(new Uint8Array(input)).reverse();
          },
        };
      },
    },
  } as {
    AMLocalSessionStore?: SessionStoreConstructor;
    PKAudioEditor: { _deps: { fls?: SessionStoreConstructor } };
    indexedDB?: IDBFactory;
    lz4BlockCodec: object;
  };
  runInNewContext(source, {
    ArrayBuffer,
    Date,
    Promise,
    Uint8Array,
    console,
    setTimeout(callback: () => void) {
      callback();
      return 1;
    },
    window: runtimeWindow,
  });
  if (!runtimeWindow.AMLocalSessionStore || !runtimeWindow.PKAudioEditor._deps.fls) {
    throw new Error('Local session store did not install');
  }
  return { codecInitializations: () => codecInitializations, runtimeWindow };
}

function init(store: SessionStore) {
  return new Promise<'ok' | 'err'>((resolve) =>
    store.Init((error) => resolve(error ? 'err' : 'ok')),
  );
}

function save(store: SessionStore, buffer: AudioBufferLike, id: IDBValidKey, name: string) {
  return new Promise<StoredSession>((resolve) =>
    store.SaveSession(buffer, id, name, (record) => resolve(record)),
  );
}

function get(store: SessionStore, id: IDBValidKey) {
  return new Promise<StoredSession | undefined>((resolve) => store.GetSession(id, resolve));
}

function list(store: SessionStore) {
  return new Promise<StoredSession[]>((resolve) => store.ListSessions(resolve));
}

function remove(store: SessionStore, id: IDBValidKey) {
  return new Promise<IDBValidKey>((resolve) => store.DelSession(id, resolve));
}

describe('generated local session store', () => {
  it('installs the named typed service and established fls facade', () => {
    const runtime = loadSessionStore();
    expect(runtime.runtimeWindow.AMLocalSessionStore).toBe(
      runtime.runtimeWindow.PKAudioEditor._deps.fls,
    );
  });

  it('reports unavailable IndexedDB through the legacy Init callback', async () => {
    const runtime = loadSessionStore();
    const Store = runtime.runtimeWindow.AMLocalSessionStore!;
    const store = new Store({
      engine: { GetWave: () => [] },
      fireEvent: () => undefined,
      mrk: { serEd: () => [] },
    });
    await expect(init(store)).resolves.toBe('err');
    expect(store.on).toBe(false);
  });

  it('initializes once and preserves compressed session CRUD behavior', async () => {
    const indexedDb = fakeIndexedDb();
    const runtime = loadSessionStore(indexedDb.factory);
    const Store = runtime.runtimeWindow.AMLocalSessionStore!;
    const events: string[] = [];
    const store = new Store({
      engine: { GetWave: () => [0, 1, 0] },
      fireEvent: (name) => events.push(name),
      mrk: { serEd: () => [{ id: 'marker-1', time: 0.5 }] },
    });
    const channels = [new Float32Array([0.25, -0.5]), new Float32Array([0.75, -1])];
    const buffer: AudioBufferLike = {
      duration: 1.23456,
      getChannelData: (channel) => channels[channel]!,
      numberOfChannels: channels.length,
      sampleRate: 48_000,
    };

    await expect(Promise.all([init(store), init(store)])).resolves.toEqual(['ok', 'ok']);
    expect(store.on).toBe(true);
    expect(events.filter((event) => event === 'DidOpenDB')).toHaveLength(1);

    await Promise.all([
      save(store, buffer, 'session-a', 'First'),
      save(store, buffer, 'session-b', 'Second'),
    ]);
    expect(runtime.codecInitializations()).toBe(1);
    expect(events.filter((event) => event === 'DidStoreDB')).toHaveLength(2);
    expect(Array.from(new Uint8Array(indexedDb.records.get('session-a')!.data[0]!))).toEqual(
      Array.from(new Uint8Array(channels[0]!.buffer)).reverse(),
    );

    const restored = await get(store, 'session-a');
    expect(restored?.name).toBe('First');
    expect(Array.from(new Float32Array(restored!.data[0]!))).toEqual([0.25, -0.5]);
    expect(Array.from(new Float32Array(restored!.data[1]!))).toEqual([0.75, -1]);
    expect((await list(store)).map((record) => record.id).sort()).toEqual([
      'session-a',
      'session-b',
    ]);

    await expect(remove(store, 'session-a')).resolves.toBe('session-a');
    expect(await get(store, 'session-a')).toBeUndefined();
  });
});
