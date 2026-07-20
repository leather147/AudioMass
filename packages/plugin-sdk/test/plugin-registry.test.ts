import { describe, expect, it } from 'vitest';

import { PluginError } from '@plugin-sdk/errors';
import { PluginHost } from '@plugin-sdk/plugin-host';
import { PluginRegistry } from '@plugin-sdk/plugin-registry';
import { MemoryStorageProvider } from '@plugin-sdk/storage';
import type { PluginModule } from '@plugin-sdk/types';

describe('PluginRegistry', () => {
  it('activates a plugin and disposes all contributions on deactivation', async () => {
    const host = new PluginHost({ storage: new MemoryStorageProvider() });
    const registry = new PluginRegistry(host);
    const plugin: PluginModule = {
      manifest: {
        apiVersion: '1',
        id: 'studio.audiomass.counter',
        name: 'Counter',
        permissions: { required: ['storage'] },
        version: '1.0.0',
      },
      async activate(context) {
        await context.storage.set('value', 41);
        context.commands.register({
          execute: async () => (await context.storage.get<number>('value')) ?? 0,
          id: 'studio.audiomass.counter.read',
          title: 'Read counter',
        });
      },
    };

    registry.install(plugin, ['storage']);
    await registry.activate(plugin.manifest.id);
    await expect(host.commands.execute('studio.audiomass.counter.read')).resolves.toBe(41);
    await registry.deactivate(plugin.manifest.id);
    await expect(host.commands.execute('studio.audiomass.counter.read')).rejects.toBeInstanceOf(
      PluginError,
    );
  });

  it('refuses installation without required permissions', () => {
    const registry = new PluginRegistry(new PluginHost());
    const plugin: PluginModule = {
      activate() {},
      manifest: {
        apiVersion: '1',
        id: 'studio.audiomass.writer',
        name: 'Writer',
        permissions: { required: ['audio:write'] },
        version: '1.0.0',
      },
    };
    expect(() => registry.install(plugin)).toThrowError(
      expect.objectContaining({ code: 'PERMISSION_DENIED' }),
    );
  });
});
