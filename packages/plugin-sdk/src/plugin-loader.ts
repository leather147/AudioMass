import { PluginError } from './errors.js';
import { validatePluginManifest } from './manifest.js';
import type { PluginModule } from './types.js';

export async function loadTrustedPlugin(url: string | URL): Promise<PluginModule> {
  const loaded: unknown = await import(url.toString());
  const candidate = loaded as { default?: unknown };
  const module = (candidate.default ?? loaded) as Partial<PluginModule>;
  if (typeof module.activate !== 'function') {
    throw new PluginError('INVALID_MANIFEST', 'Plugin module must export an activate function.');
  }
  return {
    activate: module.activate,
    deactivate: module.deactivate,
    manifest: validatePluginManifest(module.manifest),
  };
}
