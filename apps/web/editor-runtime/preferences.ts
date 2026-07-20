(() => {
  type PreferenceValues = Record<string, unknown>;
  type PreferenceListener = (key: string, value: unknown, previous: unknown) => void;

  type PreferencesService = {
    get<Value>(key: string, fallback: Value): Value;
    onChange(callback: PreferenceListener): () => void;
    remove(key: string): void;
    set<Value>(key: string, value: Value): Value;
  };

  type PreferencesWindow = Window & {
    AMPreferences?: PreferencesService;
  };

  const STORAGE_KEY = 'audiomass.preferences.v1';
  const runtimeWindow = window as PreferencesWindow;
  const listeners: PreferenceListener[] = [];
  let cache: PreferenceValues | undefined;

  function isPreferenceValues(value: unknown): value is PreferenceValues {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function legacyJson<Value>(key: string): Value | undefined {
    try {
      const stored = runtimeWindow.localStorage?.getItem(key);
      return stored ? (JSON.parse(stored) as Value) : undefined;
    } catch {
      return undefined;
    }
  }

  function read(): PreferenceValues {
    if (cache) return cache;
    cache = {};
    try {
      const stored = runtimeWindow.localStorage?.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : {};
      cache = isPreferenceValues(parsed) ? parsed : {};
      let migrated = false;
      if (!cache.locale) {
        cache.locale = runtimeWindow.localStorage?.getItem('lang') ?? undefined;
        migrated = Boolean(cache.locale);
      }
      if (cache.snapZeroCrossing === undefined) {
        const snap = runtimeWindow.localStorage?.getItem('pk_snapzc');
        if (snap !== null && snap !== undefined) {
          cache.snapZeroCrossing = snap !== '0';
          migrated = true;
        }
      }
      if (cache.animationSettings === undefined) {
        const animationSettings = legacyJson<PreferenceValues>('am_animation_settings_v1');
        if (animationSettings) {
          cache.animationSettings = animationSettings;
          migrated = true;
        }
      }
      if (cache.singleWaveformView === undefined) {
        const mode = runtimeWindow.localStorage?.getItem('pk_single_wave_view');
        if (mode === 'focus' || mode === 'normal') {
          cache.singleWaveformView = mode;
          migrated = true;
        }
      }
      if (cache.effectPresets === undefined) {
        const effectPresets = legacyJson<PreferenceValues>('pk_presetfx');
        if (effectPresets) {
          cache.effectPresets = effectPresets;
          migrated = true;
        }
      }
      if (cache.welcomeSeen === undefined) {
        const welcomeSeen = runtimeWindow.localStorage?.getItem('k');
        if (welcomeSeen !== null && welcomeSeen !== undefined) {
          cache.welcomeSeen = Boolean(welcomeSeen);
          migrated = true;
        }
      }
      if (migrated) {
        runtimeWindow.localStorage?.setItem(STORAGE_KEY, JSON.stringify(cache));
      }
    } catch {
      cache = {};
    }
    return cache;
  }

  function write() {
    try {
      runtimeWindow.localStorage?.setItem(STORAGE_KEY, JSON.stringify(read()));
    } catch {
      // Storage can be unavailable in privacy modes; runtime preferences still stay in memory.
    }
  }

  function notify(key: string, value: unknown, previous: unknown) {
    for (const listener of [...listeners]) listener(key, value, previous);
  }

  runtimeWindow.AMPreferences = {
    get<Value>(key: string, fallback: Value): Value {
      const value = read()[key];
      return value === undefined ? fallback : (value as Value);
    },
    set<Value>(key: string, value: Value): Value {
      const values = read();
      const previous = values[key];
      if (previous === value) return value;
      values[key] = value;
      write();
      notify(key, value, previous);
      return value;
    },
    remove(key: string) {
      const values = read();
      const previous = values[key];
      if (previous === undefined) return;
      delete values[key];
      write();
      notify(key, undefined, previous);
    },
    onChange(callback: PreferenceListener) {
      if (typeof callback !== 'function') return () => undefined;
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index !== -1) listeners.splice(index, 1);
      };
    },
  };
})();
