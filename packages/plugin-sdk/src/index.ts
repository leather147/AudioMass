export {
  CommandRegistry,
  ContributionRegistry,
  EffectRegistry,
  PanelRegistry,
} from './contribution-registry.js';
export { DisposableStack, toDisposable } from './disposable.js';
export { PluginError } from './errors.js';
export { validatePluginManifest } from './manifest.js';
export { loadTrustedPlugin } from './plugin-loader.js';
export { PluginHost } from './plugin-host.js';
export type { PluginHostOptions, PluginScope } from './plugin-host.js';
export { PluginRegistry } from './plugin-registry.js';
export type { InstalledPlugin } from './plugin-registry.js';
export { RpcPeer } from './rpc-peer.js';
export type { RpcTransport } from './rpc-peer.js';
export { MemoryStorageProvider, NamespacedPluginStorage, WebStorageProvider } from './storage.js';
export type { StorageProvider } from './storage.js';
export { PLUGIN_API_VERSION } from './types.js';
export type {
  AudioHostSnapshot,
  AudioPluginHost,
  CommandContribution,
  Disposable,
  Dispose,
  EffectContribution,
  PanelContribution,
  PluginContext,
  PluginManifest,
  PluginModule,
  PluginPermission,
  PluginStorage,
} from './types.js';
