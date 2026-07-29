import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

const output = join(process.cwd(), 'public', 'editor-assets');

function asset(name: string) {
  return readFileSync(join(output, name), 'utf8');
}

type Theme = {
  accent: string;
  background: string;
  id: string;
  mode: string;
  name: string;
  surface2: string;
  text: string;
  textMuted: string;
};

type ThemeRegistry = {
  defaultId: string;
  get(id?: string): Theme;
  list(): Theme[];
  tokens(id?: string): Record<string, string>;
};

describe('generated theme runtime', () => {
  it('preserves all palettes, fallback behavior, and semantic token values', () => {
    const runtimeWindow = {} as { AMThemeRegistry?: ThemeRegistry };
    runInNewContext(asset('theme-registry.js'), { window: runtimeWindow });

    const registry = runtimeWindow.AMThemeRegistry!;
    expect(registry.defaultId).toBe('replicate');
    expect(Array.from(registry.list(), (theme) => theme.id)).toEqual([
      'replicate',
      'dracula',
      'nord',
      'tokyo-night',
      'catppuccin',
      'one-dark',
      'gruvbox',
      'solarized-dark',
      'github-light',
      'solarized-light',
    ]);
    expect(registry.get('missing').id).toBe('replicate');
    expect(registry.tokens('replicate')).toMatchObject({
      background: '#050607',
      'grid-color': 'rgba(246,247,248,0.055)',
      'primary-foreground': '#050607',
      ring: '#43e4dc',
      'wave-color': '#8ef1ec',
    });
    expect(registry.tokens('github-light')).toMatchObject({
      background: '#f6f8fa',
      'color-scheme': 'light',
      'primary-foreground': '#ffffff',
    });
    const firstList = registry.list();
    firstList.pop();
    expect(registry.list()).toHaveLength(10);
  });

  it('applies and persists a theme through the shared AMTheme service', () => {
    const properties = new Map<string, string>();
    const preferences = new Map<string, unknown>();
    const events: Array<{ detail: { id: string }; type: string }> = [];
    let meta: { content?: string; name?: string } | null = null;
    const root = {
      dataset: {} as Record<string, string>,
      style: {
        colorScheme: '',
        getPropertyValue: (name: string) => properties.get(name) ?? '',
        setProperty: (name: string, value: string) => properties.set(name, value),
      },
    };
    const document = {
      createElement: () => ({}),
      documentElement: root,
      head: { appendChild: (value: typeof meta) => (meta = value) },
      querySelector: () => meta,
    };
    class FakeCustomEvent {
      constructor(
        readonly type: string,
        readonly options: { detail: { id: string } },
      ) {}
      get detail() {
        return this.options.detail;
      }
    }
    const runtimeWindow = {
      AMPreferences: {
        get: <Value>(key: string, fallback: Value) =>
          (preferences.has(key) ? preferences.get(key) : fallback) as Value,
        set: <Value>(key: string, value: Value) => {
          preferences.set(key, value);
          return value;
        },
      },
      dispatchEvent: (event: { detail: { id: string }; type: string }) => events.push(event),
      getComputedStyle: () => root.style,
    } as unknown as {
      AMTheme?: {
        color(name: string, fallback?: string): string;
        get(): Theme;
        set(id: string): Theme;
      };
      AMThemeRegistry?: ThemeRegistry;
    };
    const sandbox = { CustomEvent: FakeCustomEvent, document, window: runtimeWindow };
    runInNewContext(asset('theme-registry.js'), sandbox);
    runInNewContext(asset('theme-service.js'), sandbox);

    const selected = runtimeWindow.AMTheme!.set('github-light');
    expect(selected.id).toBe('github-light');
    expect(preferences.get('theme')).toBe('github-light');
    expect(root.dataset).toMatchObject({ theme: 'github-light', themeMode: 'light' });
    expect(root.style.colorScheme).toBe('light');
    expect(properties.get('--background')).toBe('#f6f8fa');
    expect(meta).toMatchObject({ content: '#f6f8fa', name: 'theme-color' });
    expect(events.at(-1)?.detail.id).toBe('github-light');
    expect(runtimeWindow.AMTheme!.color('background')).toBe('#f6f8fa');
  });

  it('remaps legacy canvas colors and refreshes after theme changes', () => {
    const tokens: Record<string, string> = {
      background: '#101112',
      'marker-1': '#00ff00',
      ring: '#112233',
      'wave-bg': '#101112',
    };
    const listeners = new Map<string, () => void>();

    class FakeContext {
      private fill = '';
      private shadow = '';
      private stroke = '';
      get fillStyle() {
        return this.fill;
      }
      set fillStyle(value: string) {
        this.fill = value;
      }
      get shadowColor() {
        return this.shadow;
      }
      set shadowColor(value: string) {
        this.shadow = value;
      }
      get strokeStyle() {
        return this.stroke;
      }
      set strokeStyle(value: string) {
        this.stroke = value;
      }
    }

    class FakeGradient {
      readonly stops: Array<[number, string]> = [];
      addColorStop(offset: number, value: string) {
        this.stops.push([offset, value]);
      }
    }

    const runtimeWindow = {
      AMTheme: { color: (name: string, fallback = '') => tokens[name] ?? fallback },
      CanvasGradient: FakeGradient,
      CanvasRenderingContext2D: FakeContext,
      addEventListener: (name: string, listener: () => void) => listeners.set(name, listener),
    } as unknown as {
      AMThemePaint?: {
        alpha(name: string, opacity: number, fallback: string): string;
        remap(value: unknown): unknown;
      };
    };
    runInNewContext(asset('theme-canvas.js'), { document: {}, window: runtimeWindow });

    const context = new FakeContext();
    context.fillStyle = '#43e4dc';
    context.strokeStyle = 'rgba(20,20,20,.5)';
    expect(context.fillStyle).toBe('#112233');
    expect(context.strokeStyle).toBe('rgba(16,17,18,0.5)');

    const gradient = new FakeGradient();
    gradient.addColorStop(0.5, '#9dff6a');
    expect(gradient.stops).toEqual([[0.5, '#00ff00']]);

    tokens.ring = '#abcdef';
    listeners.get('am:themechange')?.();
    expect(runtimeWindow.AMThemePaint!.remap('#43e4dc')).toBe('#abcdef');
    expect(runtimeWindow.AMThemePaint!.alpha('ring', 0.25, '#000')).toBe('rgba(171,205,239,0.25)');
  });
});

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Array<(event: { target?: FakeElement }) => void>>();
  readonly style = {
    properties: new Map<string, string>(),
    setProperty: (name: string, value: string) => this.style.properties.set(name, value),
  };
  className = '';
  hidden = false;
  id = '';
  innerHTML = '';
  parentNode: FakeElement | null = null;
  tabIndex = 0;
  textContent = '';
  type = '';
  focused = false;

  constructor(readonly tagName = 'div') {}

  readonly classList = {
    add: (...names: string[]) => this.setClasses([...this.classes(), ...names]),
    contains: (name: string) => this.classes().includes(name),
    remove: (...names: string[]) =>
      this.setClasses(this.classes().filter((name) => !names.includes(name))),
    toggle: (name: string, force?: boolean) => {
      const enabled = force ?? !this.classes().includes(name);
      const classes = this.classes().filter((value) => value !== name);
      if (enabled) classes.push(name);
      this.setClasses(classes);
      return enabled;
    },
  };

  private classes() {
    return this.className.split(/\s+/).filter(Boolean);
  }

  private setClasses(classes: string[]) {
    this.className = [...new Set(classes)].join(' ');
  }

  addEventListener(name: string, listener: (event: { target?: FakeElement }) => void) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  append(...children: FakeElement[]) {
    for (const child of children) {
      child.parentNode = this;
      this.children.push(child);
    }
  }

  dispatch(name: string, event: { target?: FakeElement } = {}) {
    for (const listener of this.listeners.get(name) ?? []) listener({ target: this, ...event });
  }

  focus() {
    this.focused = true;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches = (element: FakeElement) => {
      if (selector.startsWith('.')) return element.classList.contains(selector.slice(1));
      if (selector === '[data-settings-tab]') return element.dataset.settingsTab !== undefined;
      if (selector === '[data-settings-panel]') return element.dataset.settingsPanel !== undefined;
      return element.tagName === selector;
    };
    return this.children.flatMap((child) => [
      ...(matches(child) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
}

describe('generated appearance service', () => {
  it('switches themes and locales without losing canonical English copy', () => {
    const body = new FakeElement('body');
    const returnFocus = new FakeElement('button');
    const timers: Array<{ callback: () => void; delay: number }> = [];
    const selected: string[] = [];
    const themes: Theme[] = [
      {
        accent: '#43e4dc',
        background: '#050607',
        id: 'replicate',
        mode: 'dark',
        name: 'Replicate',
        surface2: '#0c0f12',
        text: '#f6f7f8',
        textMuted: '#b2bcc8',
      },
      {
        accent: '#0969da',
        background: '#f6f8fa',
        id: 'github-light',
        mode: 'light',
        name: 'GitHub Light',
        surface2: '#f3f4f6',
        text: '#1f2328',
        textMuted: '#57606a',
      },
    ];
    const document = {
      activeElement: returnFocus,
      body,
      createElement: (tag: string) => new FakeElement(tag),
    };
    let locale = 'ru';
    const originals = new WeakMap<FakeElement, string>();
    const dictionary: Record<string, string> = { Settings: 'Настройки' };
    const translateTree = (root: FakeElement) => {
      const pending = [root];
      while (pending.length) {
        const element = pending.shift()!;
        if (element.textContent) {
          if (!originals.has(element)) originals.set(element, element.textContent);
          const original = originals.get(element)!;
          element.textContent = locale === 'ru' ? (dictionary[original] ?? original) : original;
        }
        pending.push(...element.children);
      }
    };
    const runtimeWindow = {
      AMI18n: {
        getLocale: () => locale,
        setLocale: (value: string) => {
          locale = value;
          translateTree(body);
          return true;
        },
        t: (value: string) => (locale === 'ru' ? (dictionary[value] ?? value) : value),
        translateTree,
      },
      AMTheme: {
        get: () => themes[0],
        list: () => themes.slice(),
        set: (id: string) => {
          selected.push(id);
          return themes.find((theme) => theme.id === id) ?? themes[0]!;
        },
      },
      addEventListener: () => undefined,
      requestAnimationFrame: (callback: () => void) => {
        callback();
        return 1;
      },
      setTimeout: (callback: () => void, delay: number) => {
        timers.push({ callback, delay });
        return timers.length;
      },
    } as unknown as {
      AMAppearance?: { close(): void; open(tab?: string): void };
    };
    runInNewContext(asset('appearance-service.js'), {
      HTMLElement: FakeElement,
      document,
      window: runtimeWindow,
    });

    runtimeWindow.AMAppearance!.open('themes');
    expect(body.classList.contains('am_preferences_open')).toBe(true);
    const overlay = body.children[0]!;
    const heading = overlay.querySelectorAll('h2')[0]!;
    expect(heading.textContent).toBe('Настройки');
    expect(overlay.querySelectorAll('.am_theme_card')).toHaveLength(2);
    const lightCard = overlay.querySelectorAll('.am_theme_card')[1]!;
    lightCard.dispatch('click');
    expect(selected).toEqual(['github-light']);
    expect(lightCard.attributes.get('aria-pressed')).toBe('true');

    const englishCard = overlay.querySelectorAll('.am_language_card')[1]!;
    englishCard.dispatch('click');
    expect(heading.textContent).toBe('Settings');

    runtimeWindow.AMAppearance!.close();
    expect(body.classList.contains('am_preferences_open')).toBe(false);
    expect(returnFocus.focused).toBe(true);
    expect(timers[0]?.delay).toBe(140);
    timers[0]?.callback();
    expect(body.children).toHaveLength(0);
  });
});
