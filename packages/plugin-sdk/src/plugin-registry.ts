import { DisposableStack, toDisposable } from './disposable.js';
import { PluginError } from './errors.js';
import { validatePluginManifest } from './manifest.js';
import type { PluginHost, PluginScope } from './plugin-host.js';
import type { PluginManifest, PluginModule, PluginPermission } from './types.js';

export interface InstalledPlugin {
  active: boolean;
  grantedPermissions: readonly PluginPermission[];
  manifest: PluginManifest;
}

interface PluginRecord {
  active: boolean;
  granted: Set<PluginPermission>;
  manifest: PluginManifest;
  module: PluginModule;
  scope?: PluginScope;
}

export class PluginRegistry {
  private readonly records = new Map<string, PluginRecord>();

  constructor(private readonly host: PluginHost) {}

  install(
    module: PluginModule,
    grantedPermissions: readonly PluginPermission[] = [],
  ): InstalledPlugin {
    const manifest = validatePluginManifest(module.manifest);
    if (this.records.has(manifest.id)) {
      throw new PluginError('ALREADY_INSTALLED', `Plugin ${manifest.id} is already installed.`);
    }
    const declared = new Set([
      ...(manifest.permissions?.required ?? []),
      ...(manifest.permissions?.optional ?? []),
    ]);
    const granted = new Set(grantedPermissions);
    for (const permission of granted) {
      if (!declared.has(permission)) {
        throw new PluginError(
          'PERMISSION_DENIED',
          `Plugin ${manifest.id} did not declare ${permission}.`,
        );
      }
    }
    for (const permission of manifest.permissions?.required ?? []) {
      if (!granted.has(permission)) {
        throw new PluginError('PERMISSION_DENIED', `Plugin ${manifest.id} requires ${permission}.`);
      }
    }
    const record: PluginRecord = { active: false, granted, manifest, module };
    this.records.set(manifest.id, record);
    return this.describe(record);
  }

  async activate(id: string): Promise<InstalledPlugin> {
    const record = this.require(id);
    if (record.active) return this.describe(record);
    const scope = this.host.createScope(record.manifest, record.granted);
    const activation = new DisposableStack();
    activation.add(scope);
    try {
      const result = await record.module.activate(scope.context);
      if (result) activation.add(toDisposable(result));
      record.scope = { context: scope.context, dispose: () => activation.dispose() };
      record.active = true;
      return this.describe(record);
    } catch (error) {
      await activation.dispose();
      throw new PluginError('ACTIVATION_FAILED', `Plugin ${id} failed to activate.`, {
        cause: error,
      });
    }
  }

  async deactivate(id: string): Promise<InstalledPlugin> {
    const record = this.require(id);
    if (!record.active) return this.describe(record);
    const errors: unknown[] = [];
    try {
      await record.module.deactivate?.();
    } catch (error) {
      errors.push(error);
    }
    try {
      await record.scope?.dispose();
    } catch (error) {
      errors.push(error);
    }
    record.scope = undefined;
    record.active = false;
    if (errors.length > 0) throw new AggregateError(errors, `Plugin ${id} failed to deactivate.`);
    return this.describe(record);
  }

  async uninstall(id: string): Promise<void> {
    await this.deactivate(id);
    this.records.delete(id);
  }

  get(id: string): InstalledPlugin | undefined {
    const record = this.records.get(id);
    return record ? this.describe(record) : undefined;
  }

  list(): readonly InstalledPlugin[] {
    return [...this.records.values()].map((record) => this.describe(record));
  }

  private require(id: string): PluginRecord {
    const record = this.records.get(id);
    if (!record) throw new PluginError('NOT_INSTALLED', `Plugin ${id} is not installed.`);
    return record;
  }

  private describe(record: PluginRecord): InstalledPlugin {
    return {
      active: record.active,
      grantedPermissions: [...record.granted],
      manifest: record.manifest,
    };
  }
}
