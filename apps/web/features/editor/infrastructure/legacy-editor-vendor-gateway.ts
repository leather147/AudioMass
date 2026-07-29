import { EDITOR_VENDOR_ASSETS } from './vendor-assets';

export type WaveSurferInstance = object;

export type WaveSurferPlugin = object;

export interface WaveSurferRuntime {
  create(options: object): WaveSurferInstance;
  regions: {
    create(options: object): WaveSurferPlugin;
  };
}

export interface Lz4BlockCodec {
  decodeBlock(input: ArrayBuffer | ArrayBufferView, offset: number, size: number): ArrayBufferView;
  encodeBlock(input: ArrayBuffer | ArrayBufferView, offset: number): ArrayBufferView;
}

export interface NoiseSuppressionRuntime {
  cwrap(
    name: string,
    returnType: string | null,
    argumentTypes?: readonly string[],
  ): (...arguments_: number[]) => number;
}

export interface VendorScriptLoader {
  load(path: string): Promise<void>;
}

export type VendorWorkerFactory = (url: string, options: WorkerOptions) => Worker;

function property(value: object, key: PropertyKey): unknown {
  return Reflect.get(value, key);
}

function isObject(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function isCallable(value: unknown): value is (...arguments_: unknown[]) => unknown {
  return typeof value === 'function';
}

function callable(value: object, key: PropertyKey): ((...arguments_: unknown[]) => unknown) | null {
  const candidate = property(value, key);
  return isCallable(candidate) ? candidate : null;
}

function requireObject(runtime: object, key: PropertyKey, label: string): object {
  const candidate = property(runtime, key);
  if (!isObject(candidate)) throw new TypeError(`${label} did not expose its expected runtime.`);
  return candidate;
}

function requireWaveSurfer(runtime: object): WaveSurferRuntime {
  const waveSurfer = requireObject(runtime, 'WaveSurfer', 'WaveSurfer');
  const regions = requireObject(waveSurfer, 'regions', 'WaveSurfer regions');
  const create = callable(waveSurfer, 'create');
  const createRegions = callable(regions, 'create');
  if (!create || !createRegions) throw new TypeError('WaveSurfer vendor contract is invalid.');
  return {
    create: (options) => {
      const instance = Reflect.apply(create, waveSurfer, [options]);
      if (!isObject(instance))
        throw new TypeError('WaveSurfer.create returned an invalid instance.');
      return instance;
    },
    regions: {
      create: (options) => {
        const plugin = Reflect.apply(createRegions, regions, [options]);
        if (!isObject(plugin))
          throw new TypeError('WaveSurfer regions returned an invalid plugin.');
        return plugin;
      },
    },
  };
}

function requireLz4Codec(value: unknown): Lz4BlockCodec {
  if (!isObject(value)) throw new TypeError('LZ4 runtime could not create a codec.');
  const decodeBlock = callable(value, 'decodeBlock');
  const encodeBlock = callable(value, 'encodeBlock');
  if (!decodeBlock || !encodeBlock) throw new TypeError('LZ4 codec contract is invalid.');
  return {
    decodeBlock: (input, offset, size) => {
      const decoded = Reflect.apply(decodeBlock, value, [input, offset, size]);
      if (!ArrayBuffer.isView(decoded)) throw new TypeError('LZ4 returned invalid decoded data.');
      return decoded;
    },
    encodeBlock: (input, offset) => {
      const encoded = Reflect.apply(encodeBlock, value, [input, offset]);
      if (!ArrayBuffer.isView(encoded)) throw new TypeError('LZ4 returned invalid encoded data.');
      return encoded;
    },
  };
}

function requireNoiseRuntime(runtime: object): NoiseSuppressionRuntime {
  const noiseModule = requireObject(runtime, 'Module', 'RNNoise');
  const cwrap = callable(noiseModule, 'cwrap');
  if (!cwrap) throw new TypeError('RNNoise vendor contract is invalid.');
  return {
    cwrap: (name, returnType, argumentTypes) => {
      const wrapped = Reflect.apply(cwrap, noiseModule, [name, returnType, argumentTypes]);
      if (typeof wrapped !== 'function')
        throw new TypeError('RNNoise cwrap returned an invalid function.');
      return (...arguments_) => {
        const result = Reflect.apply(wrapped, noiseModule, arguments_);
        if (typeof result !== 'number')
          throw new TypeError('RNNoise returned a non-numeric result.');
        return result;
      };
    },
  };
}

export class BrowserVendorScriptLoader implements VendorScriptLoader {
  private readonly pending = new Map<string, Promise<void>>();

  public constructor(private readonly document: Document = globalThis.document) {}

  public load(path: string): Promise<void> {
    const existing = this.pending.get(path);
    if (existing) return existing;
    const promise = new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.async = true;
      script.dataset['editorVendor'] = path;
      script.src = path;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener(
        'error',
        () => reject(new Error(`Could not load editor vendor asset: ${path}`)),
        { once: true },
      );
      this.document.head.append(script);
    });
    this.pending.set(path, promise);
    void promise.catch(() => this.pending.delete(path));
    return promise;
  }
}

export class LegacyEditorVendorGateway {
  public constructor(
    private readonly scripts: VendorScriptLoader = new BrowserVendorScriptLoader(),
    private readonly runtime: object = globalThis,
    private readonly createWorker: VendorWorkerFactory = (url, options) => new Worker(url, options),
  ) {}

  public createFlacEncoderWorker(): Worker {
    return this.createWorker(EDITOR_VENDOR_ASSETS.flacEncoder.path, {
      name: 'audiomass-flac-encoder',
      type: 'classic',
    });
  }

  public createMp3EncoderWorker(): Worker {
    return this.createWorker(EDITOR_VENDOR_ASSETS.mp3Encoder.path, {
      name: 'audiomass-mp3-encoder',
      type: 'classic',
    });
  }

  public async loadCompressionCodec(): Promise<Lz4BlockCodec> {
    await this.scripts.load(EDITOR_VENDOR_ASSETS.lz4Dispatcher.path);
    const dispatcher = requireObject(this.runtime, 'lz4BlockCodec', 'LZ4');
    const createInstance = callable(dispatcher, 'createInstance');
    if (!createInstance) throw new TypeError('LZ4 dispatcher contract is invalid.');
    const instance = await Promise.resolve(Reflect.apply(createInstance, dispatcher, ['wasm']));
    return requireLz4Codec(instance);
  }

  public async loadNoiseSuppression(): Promise<NoiseSuppressionRuntime> {
    await this.scripts.load(EDITOR_VENDOR_ASSETS.noiseSuppressor.path);
    return requireNoiseRuntime(this.runtime);
  }

  public async loadWaveSurfer(): Promise<WaveSurferRuntime> {
    await this.scripts.load(EDITOR_VENDOR_ASSETS.waveformCore.path);
    await this.scripts.load(EDITOR_VENDOR_ASSETS.waveformRegions.path);
    return requireWaveSurfer(this.runtime);
  }
}
