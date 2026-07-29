(() => {
  type ScriptCallback = (() => void) | undefined;
  type ScriptWaiter = [ok: ScriptCallback, fail: ScriptCallback];

  interface RuntimeFileStore {
    GetSession(id: string, callback: (value?: { id?: string }) => void): void;
    Init(callback: () => void): void;
  }

  interface RuntimeEngine {
    LoadDB(value: { id?: string }): void;
    wavesurfer?: AMRuntimeWaveSurfer;
  }

  interface RuntimeMultitrack extends AMRuntimeMultitrack {
    Propagate?(name: string, value?: unknown, value2?: unknown): boolean;
    Toggle?(enabled: boolean): void;
  }

  interface RuntimeDependencies {
    amss?: new (app: RuntimeApp) => unknown;
    engine: new (app: RuntimeApp) => RuntimeEngine;
    fls: new (app: RuntimeApp) => RuntimeFileStore;
    mrk?: new (app: RuntimeApp) => unknown;
    multitrack?: new (app: RuntimeApp) => RuntimeMultitrack;
    rec: new (app: RuntimeApp) => AMRuntimeRecorder;
    state: new (depth: number, app: RuntimeApp) => AMRuntimeStateManager;
    ui: new (app: RuntimeApp) => AMRuntimeUI;
    uifx(app: RuntimeApp): void;
    [name: string]: unknown;
  }

  interface RuntimeApp {
    _deps: RuntimeDependencies;
    amss: unknown;
    engine: RuntimeEngine;
    el: HTMLElement | null;
    fireEvent(name: string, value?: unknown, value2?: unknown): unknown;
    fls: RuntimeFileStore;
    id: number;
    init(elementId: string): RuntimeApp | undefined;
    isMobile: boolean;
    listenFor(name: string, callback: AMRuntimeEventListener): void;
    loadScript(src: string, ok?: () => void, fail?: () => void): void;
    mrk: unknown;
    multitrack: RuntimeMultitrack | null;
    rec: AMRuntimeRecorder;
    setLanguage(locale: string): boolean;
    state: AMRuntimeStateManager;
    stopListeningFor(name: string, callback: AMRuntimeEventListener): boolean;
    stopListeningForName(name: string): boolean;
    ui: AMRuntimeUI;
    wheelInfo(event: WheelEvent): {
      ax: number;
      ay: number;
      pinch: boolean;
      x: number;
      y: number;
    };
    wheelZoomFactor(delta: number): number;
    fadeGain(position: number): number;
  }

  type RuntimeWindow = Window & {
    AMLateRuntimeValue?: (name: string) => RuntimeCallable;
    AMI18n?: { setLocale?(locale: string): boolean };
    PKAudioEditor: RuntimeApp;
    PKAudioList: RuntimeApp[];
  };

  interface RuntimeCallable {
    (...args: unknown[]): unknown;
    new (...args: unknown[]): object;
  }

  const runtimeWindow = window as unknown as RuntimeWindow;
  let nextId = -1;

  function lateRuntimeValue(name: string): RuntimeCallable {
    const resolve = () =>
      (runtimeWindow as unknown as Record<string, RuntimeCallable>)[name] as RuntimeCallable;
    const target = function () {} as unknown as RuntimeCallable;
    const facade: RuntimeCallable = new Proxy(target, {
      apply: (_target, thisArg, args) => Reflect.apply(resolve(), thisArg, args),
      construct: (_target, args, newTarget) => {
        const implementation = resolve();
        return Reflect.construct(
          implementation,
          args,
          newTarget === facade ? implementation : newTarget,
        );
      },
      get: (_target, property) => Reflect.get(resolve(), property),
      set: (_target, property, value) => Reflect.set(resolve(), property, value),
    });
    return facade;
  }

  class AudioMassEditor implements RuntimeApp {
    readonly id = ++nextId;
    readonly _deps = {} as RuntimeDependencies;
    el: HTMLElement | null = null;
    isMobile = /iphone|ipod|ipad|android/.test(navigator.userAgent.toLowerCase());
    mrk: unknown = null;
    ui = undefined as unknown as AMRuntimeUI;
    engine = undefined as unknown as RuntimeEngine;
    state = undefined as unknown as AMRuntimeStateManager;
    rec = undefined as unknown as AMRuntimeRecorder;
    fls = undefined as unknown as RuntimeFileStore;
    amss: unknown = null;
    multitrack: RuntimeMultitrack | null = null;

    private readonly events: Record<string, Array<AMRuntimeEventListener | null> | null> = {};
    private readonly scripts: Record<string, true | ScriptWaiter[] | null> = {};

    constructor() {
      runtimeWindow.PKAudioList[this.id] = this;
    }

    fireEvent = (name: string, value?: unknown, value2?: unknown) => {
      if (
        this.multitrack &&
        name.startsWith('Request') &&
        this.multitrack.Propagate?.(name, value, value2)
      ) {
        return true;
      }
      const group = this.events[name];
      if (!group) return false;
      for (let index = group.length - 1; index >= 0; index -= 1) {
        group[index]?.(value, value2);
      }
    };

    listenFor = (name: string, callback: AMRuntimeEventListener) => {
      const group = this.events[name];
      if (!group) this.events[name] = [callback];
      else group.unshift(callback);
    };

    stopListeningFor(name: string, callback: AMRuntimeEventListener) {
      const group = this.events[name];
      if (!group) return false;
      for (let index = group.length - 1; index >= 0; index -= 1) {
        if (group[index] === callback) {
          group[index] = null;
          break;
        }
      }
      return true;
    }

    stopListeningForName(name: string) {
      if (!this.events[name]) return false;
      this.events[name] = null;
      return true;
    }

    wheelInfo(event: WheelEvent) {
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      let x = (event.deltaX || 0) * multiplier;
      let y = (event.deltaY || 0) * multiplier;
      if (event.shiftKey && Math.abs(x) < Math.abs(y)) {
        x = y;
        y = 0;
      }
      return { x, y, ax: Math.abs(x), ay: Math.abs(y), pinch: Boolean(event.ctrlKey) };
    }

    wheelZoomFactor(delta: number) {
      return Math.max(0.2, Math.min(5, Math.pow(1.0025, -delta)));
    }

    fadeGain(position: number) {
      const bounded = Math.max(0, Math.min(1, position));
      return bounded * bounded;
    }

    loadScript(src: string, ok?: () => void, fail?: () => void) {
      const current = this.scripts[src];
      if (current === true) {
        ok?.();
        return;
      }
      if (current) {
        current.push([ok, fail]);
        return;
      }
      this.scripts[src] = [[ok, fail]];
      const script = document.createElement('script');
      script.onload = () => {
        const waiters = this.scripts[src];
        this.scripts[src] = true;
        if (Array.isArray(waiters)) for (const [done] of waiters) done?.();
      };
      script.onerror = () => {
        const waiters = this.scripts[src];
        this.scripts[src] = null;
        if (Array.isArray(waiters)) for (const [, rejected] of waiters) rejected?.();
      };
      script.src = src;
      document.head.append(script);
    }

    init(elementId: string) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.log('invalid element');
        return;
      }
      this.el = element;
      this.mrk = this._deps.mrk ? new this._deps.mrk(this) : null;
      this.ui = new this._deps.ui(this);
      this._deps.uifx(this);
      this.engine = new this._deps.engine(this);
      this.state = new this._deps.state(96, this);
      this.rec = new this._deps.rec(this);
      this.fls = new this._deps.fls(this);
      this.amss = this._deps.amss ? new this._deps.amss(this) : null;
      this.multitrack = this._deps.multitrack ? new this._deps.multitrack(this) : null;

      if (this.multitrack && /[?&]multitrack=1\b/.test(location.search)) {
        this.multitrack.Toggle?.(true);
      }

      const sessionId = location.href.split('local=')[1];
      if (sessionId) {
        this.fls.Init(() => {
          this.fls.GetSession(sessionId, (entry) => {
            if (entry?.id === sessionId) this.engine.LoadDB(entry);
          });
        });
      }
      return this;
    }

    setLanguage(locale: string) {
      return Boolean(runtimeWindow.AMI18n?.setLocale?.(locale));
    }
  }

  runtimeWindow.AMLateRuntimeValue ??= lateRuntimeValue;
  runtimeWindow.PKAudioList ??= [];
  runtimeWindow.PKAudioEditor = new AudioMassEditor();
  runtimeWindow.PKAudioList.push(runtimeWindow.PKAudioEditor);
})();
