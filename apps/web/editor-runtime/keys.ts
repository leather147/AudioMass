(() => {
  interface KeyDependencies extends Record<string, unknown> {
    keyhandler?: new () => AMRuntimeKeyHandlerFull;
  }

  class RuntimeKeyHandler implements AMRuntimeKeyHandlerFull {
    keyMap: Record<number, boolean> = {};
    callbacks: Record<string, AMRuntimeKeyCallback | null> = {};
    singleCallbacks: Record<string, AMRuntimeSingleKeyCallback | null> = {};
    readonly mac = /mac|iphone|ipad|ipod/.test((navigator.platform || '').toLowerCase());

    constructor() {
      document.addEventListener('keydown', (event) => this.keyDown(event.keyCode, event));
      document.addEventListener('keyup', (event) => this.keyUp(event.keyCode));
      document.addEventListener('keypress', (event) => this.keyPress(event.keyCode, event));
      window.addEventListener('blur', () => {
        this.keyMap = {};
      });
      document.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    isAccel(event?: KeyboardEvent) {
      return Boolean(event && (this.mac ? event.metaKey : event.ctrlKey) && !event.altKey);
    }

    isEditTarget(event?: Event) {
      const target = event?.target;
      return target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(target.tagName);
    }

    addCallback(name: string, callback: AMRuntimeKeyCallback['callback'], keys: number[]) {
      this.callbacks[name] = { keys, callback };
    }

    addSingleCallback(name: string, callback: AMRuntimeSingleKeyCallback['callback'], key: number) {
      this.singleCallbacks[name] = { key, callback };
    }

    removeCallback(name: string) {
      this.callbacks[name] = null;
    }

    keyDown(keyCode: number, event: KeyboardEvent) {
      this.keyMap[keyCode] = true;
      for (const group of Object.values(this.callbacks)) {
        if (!group || keyCode !== group.keys.at(-1)) continue;
        if (group.keys.every((key) => this.keyMap[key])) {
          group.callback(keyCode, this.keyMap, event);
        }
      }
    }

    keyUp(keyCode: number) {
      this.keyMap[keyCode] = false;
    }

    keyPress(keyCode: number, event: KeyboardEvent) {
      if (this.isEditTarget(event)) return;
      for (const group of Object.values(this.singleCallbacks)) {
        if (group?.key === keyCode) group.callback(event);
      }
    }
  }

  (PKAudioEditor._deps as KeyDependencies).keyhandler = RuntimeKeyHandler;
})();
