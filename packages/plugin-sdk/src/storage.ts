import type { PluginStorage } from './types.js';

export interface StorageProvider {
  delete(key: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  keys(prefix: string): Promise<readonly string[]>;
  set(key: string, value: string): Promise<void>;
}

export class MemoryStorageProvider implements StorageProvider {
  private readonly values = new Map<string, string>();

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async get(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async keys(prefix: string): Promise<readonly string[]> {
    return [...this.values.keys()].filter((key) => key.startsWith(prefix));
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

export class WebStorageProvider implements StorageProvider {
  constructor(private readonly storage: Storage) {}

  async delete(key: string): Promise<void> {
    this.storage.removeItem(key);
  }

  async get(key: string): Promise<string | undefined> {
    return this.storage.getItem(key) ?? undefined;
  }

  async keys(prefix: string): Promise<readonly string[]> {
    const result: string[] = [];
    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (key?.startsWith(prefix)) result.push(key);
    }
    return result;
  }

  async set(key: string, value: string): Promise<void> {
    this.storage.setItem(key, value);
  }
}

export class NamespacedPluginStorage implements PluginStorage {
  private readonly prefix: string;

  constructor(
    pluginId: string,
    private readonly provider: StorageProvider,
  ) {
    this.prefix = `audiomass:plugin:${pluginId}:`;
  }

  async clear(): Promise<void> {
    const keys = await this.provider.keys(this.prefix);
    await Promise.all(keys.map((key) => this.provider.delete(key)));
  }

  async delete(key: string): Promise<void> {
    await this.provider.delete(this.key(key));
  }

  async get<Value>(key: string): Promise<Value | undefined> {
    const value = await this.provider.get(this.key(key));
    return value === undefined ? undefined : (JSON.parse(value) as Value);
  }

  async set<Value>(key: string, value: Value): Promise<void> {
    await this.provider.set(this.key(key), JSON.stringify(value));
  }

  private key(key: string): string {
    if (!key || key.includes(':'))
      throw new TypeError('Plugin storage keys cannot be empty or contain colons.');
    return `${this.prefix}${key}`;
  }
}
