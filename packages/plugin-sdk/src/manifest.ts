import { PluginError } from './errors.js';
import { PLUGIN_API_VERSION } from './types.js';
import type { PluginManifest, PluginPermission } from './types.js';

const IDENTIFIER = /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/;
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PERMISSIONS: readonly PluginPermission[] = [
  'audio:read',
  'audio:write',
  'storage',
  'ui:panel',
];

function isPermission(value: unknown): value is PluginPermission {
  return PERMISSIONS.includes(value as PluginPermission);
}

export function validatePluginManifest(value: unknown): PluginManifest {
  if (!value || typeof value !== 'object') {
    throw new PluginError('INVALID_MANIFEST', 'Plugin manifest must be an object.');
  }
  const manifest = value as Partial<PluginManifest>;
  if (!manifest.id || !IDENTIFIER.test(manifest.id)) {
    throw new PluginError('INVALID_MANIFEST', 'Plugin id must be a namespaced identifier.');
  }
  if (!manifest.name?.trim()) {
    throw new PluginError('INVALID_MANIFEST', 'Plugin name is required.');
  }
  if (!manifest.version || !SEMVER.test(manifest.version)) {
    throw new PluginError('INVALID_MANIFEST', 'Plugin version must use semantic versioning.');
  }
  if (manifest.apiVersion !== PLUGIN_API_VERSION) {
    throw new PluginError(
      'INVALID_MANIFEST',
      `Plugin API ${String(manifest.apiVersion)} is incompatible with ${PLUGIN_API_VERSION}.`,
    );
  }

  const required = manifest.permissions?.required ?? [];
  const optional = manifest.permissions?.optional ?? [];
  if (![...required, ...optional].every(isPermission)) {
    throw new PluginError('INVALID_MANIFEST', 'Plugin manifest contains an unknown permission.');
  }
  if (required.some((permission) => optional.includes(permission))) {
    throw new PluginError('INVALID_MANIFEST', 'A permission cannot be both required and optional.');
  }
  return {
    ...manifest,
    apiVersion: PLUGIN_API_VERSION,
    id: manifest.id,
    name: manifest.name.trim(),
    permissions: { optional: [...optional], required: [...required] },
    version: manifest.version,
  };
}
