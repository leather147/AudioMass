export const PLUGIN_API_VERSION = '1' as const;

export type PluginPermission = 'audio:read' | 'audio:write' | 'storage' | 'ui:panel';

export interface PluginManifest {
  apiVersion: typeof PLUGIN_API_VERSION;
  description?: string;
  homepage?: string;
  id: string;
  name: string;
  permissions?: {
    optional?: readonly PluginPermission[];
    required?: readonly PluginPermission[];
  };
  version: string;
}

export interface Disposable {
  dispose(): void | Promise<void>;
}

export type Dispose = () => void | Promise<void>;

export interface AudioHostSnapshot {
  duration: number;
  position: number;
  state: string;
  trackCount: number;
}

export interface AudioPluginHost {
  dispatch(command: string, payload?: unknown): Promise<unknown>;
  snapshot(): Promise<AudioHostSnapshot>;
}

export interface CommandContribution<Arguments = unknown, Result = unknown> {
  execute(argumentsValue: Arguments): Result | Promise<Result>;
  id: string;
  title: string;
}

export interface EffectContribution {
  createNode(context: BaseAudioContext, options?: Readonly<Record<string, number>>): AudioNode;
  id: string;
  title: string;
}

export interface PanelContribution {
  id: string;
  mount(container: HTMLElement): Disposable | Dispose | void;
  title: string;
}

export interface PluginStorage {
  clear(): Promise<void>;
  delete(key: string): Promise<void>;
  get<Value>(key: string): Promise<Value | undefined>;
  set<Value>(key: string, value: Value): Promise<void>;
}

export interface PluginContext {
  readonly audio: {
    dispatch(command: string, payload?: unknown): Promise<unknown>;
    snapshot(): Promise<AudioHostSnapshot>;
  };
  readonly commands: {
    register(contribution: CommandContribution): Disposable;
  };
  readonly effects: {
    register(contribution: EffectContribution): Disposable;
  };
  readonly manifest: PluginManifest;
  onDeactivate(dispose: Disposable | Dispose): void;
  readonly panels: {
    register(contribution: PanelContribution): Disposable;
  };
  readonly storage: PluginStorage;
}

export interface PluginModule {
  activate(
    context: PluginContext,
  ): Disposable | Dispose | void | Promise<Disposable | Dispose | void>;
  deactivate?(): void | Promise<void>;
  manifest: PluginManifest;
}
