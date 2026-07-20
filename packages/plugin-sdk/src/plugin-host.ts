import { CommandRegistry, EffectRegistry, PanelRegistry } from './contribution-registry.js';
import { DisposableStack } from './disposable.js';
import { PluginError } from './errors.js';
import { MemoryStorageProvider, NamespacedPluginStorage } from './storage.js';
import type { StorageProvider } from './storage.js';
import type {
  AudioPluginHost,
  Disposable,
  PluginContext,
  PluginManifest,
  PluginPermission,
} from './types.js';

export interface PluginHostOptions {
  audio?: AudioPluginHost;
  storage?: StorageProvider;
}

export interface PluginScope extends Disposable {
  context: PluginContext;
}

export class PluginHost {
  readonly commands = new CommandRegistry();
  readonly effects = new EffectRegistry();
  readonly panels = new PanelRegistry();
  private readonly audio?: AudioPluginHost;
  private readonly storage: StorageProvider;

  constructor(options: PluginHostOptions = {}) {
    this.audio = options.audio;
    this.storage = options.storage ?? new MemoryStorageProvider();
  }

  createScope(
    manifest: PluginManifest,
    grantedPermissions: ReadonlySet<PluginPermission>,
  ): PluginScope {
    const disposables = new DisposableStack();
    const requirePermission = (permission: PluginPermission): void => {
      if (!grantedPermissions.has(permission)) {
        throw new PluginError(
          'PERMISSION_DENIED',
          `Plugin ${manifest.id} does not have ${permission} permission.`,
        );
      }
    };
    const requireAudio = (): AudioPluginHost => {
      if (!this.audio) {
        throw new PluginError('PERMISSION_DENIED', 'The host did not expose an audio session.');
      }
      return this.audio;
    };
    const storage = new NamespacedPluginStorage(manifest.id, this.storage);

    const context: PluginContext = {
      audio: {
        dispatch: async (command, payload) => {
          requirePermission('audio:write');
          return requireAudio().dispatch(command, payload);
        },
        snapshot: async () => {
          requirePermission('audio:read');
          return requireAudio().snapshot();
        },
      },
      commands: {
        register: (contribution) =>
          disposables.add(this.commands.register(manifest.id, contribution)),
      },
      effects: {
        register: (contribution) => {
          requirePermission('audio:write');
          return disposables.add(this.effects.register(manifest.id, contribution));
        },
      },
      manifest,
      onDeactivate: (dispose) => {
        disposables.add(dispose);
      },
      panels: {
        register: (contribution) => {
          requirePermission('ui:panel');
          return disposables.add(this.panels.register(manifest.id, contribution));
        },
      },
      storage: {
        clear: async () => {
          requirePermission('storage');
          await storage.clear();
        },
        delete: async (key) => {
          requirePermission('storage');
          await storage.delete(key);
        },
        get: async <Value>(key: string) => {
          requirePermission('storage');
          return storage.get<Value>(key);
        },
        set: async <Value>(key: string, value: Value) => {
          requirePermission('storage');
          await storage.set(key, value);
        },
      },
    };

    return { context, dispose: () => disposables.dispose() };
  }
}
