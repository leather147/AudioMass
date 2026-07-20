(() => {
  type Theme = {
    background: string;
    id: string;
    mode: string;
  };

  type ThemeRegistry = {
    defaultId: string;
    get(id: string | null): Theme;
    list: unknown;
    tokens(id: string): Record<string, string>;
  };

  type ThemeWindow = Window & {
    AMPreferences?: {
      get<Value>(key: string, fallback: Value): Value;
      set<Value>(key: string, value: Value): Value;
    };
    AMTheme?: {
      apply(): Theme;
      color(name: string, fallback?: string): string;
      get(): Theme;
      list: unknown;
      set(id: string): Theme;
    };
    AMThemeRegistry: ThemeRegistry;
  };

  const runtimeWindow = window as unknown as ThemeWindow;
  const registry = runtimeWindow.AMThemeRegistry;
  let current: string | null = null;

  function selected() {
    return runtimeWindow.AMPreferences?.get('theme', registry.defaultId) ?? registry.defaultId;
  }

  function apply(id: string, persist: boolean) {
    const theme = registry.get(id);
    const values = registry.tokens(theme.id);
    const root = document.documentElement;
    for (const [key, value] of Object.entries(values)) root.style.setProperty(`--${key}`, value);
    root.dataset.theme = theme.id;
    root.dataset.themeMode = theme.mode;
    root.style.colorScheme = theme.mode;
    current = theme.id;
    if (persist) runtimeWindow.AMPreferences?.set('theme', theme.id);

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme.background;
    runtimeWindow.dispatchEvent(
      new CustomEvent('am:themechange', { detail: { id: theme.id, theme, tokens: values } }),
    );
    return theme;
  }

  runtimeWindow.AMTheme = {
    get: () => registry.get(current ?? selected()),
    list: registry.list,
    set: (id) => apply(id, true),
    apply: () => apply(selected(), false),
    color(name, fallback = '') {
      return (
        runtimeWindow
          .getComputedStyle(document.documentElement)
          .getPropertyValue(`--${name}`)
          .trim() || fallback
      );
    },
  };

  apply(selected(), false);
})();
