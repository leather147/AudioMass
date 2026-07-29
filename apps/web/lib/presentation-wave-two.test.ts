import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

const output = join(process.cwd(), 'public', 'editor-assets');
const asset = (name: string) => readFileSync(join(output, name), 'utf8');

type Listener = (event: FakeEvent) => void;

class FakeEvent {
  defaultPrevented = false;
  propagationStopped = false;
  target: FakeElement | null = null;

  constructor(
    readonly type: string,
    values: Record<string, unknown> = {},
  ) {
    Object.assign(this, values);
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }
}

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Listener[]>();
  readonly style: Record<string, string | ((name: string, value: string) => void)> = {
    setProperty: (name: string, value: string) => {
      this.style[name] = value;
    },
  };
  className = '';
  clientHeight = 38;
  clientWidth = 180;
  height = 38;
  href = '';
  innerHTML = '';
  offsetHeight = 38;
  offsetLeft = 0;
  offsetTop = 0;
  offsetWidth = 180;
  parentNode: FakeElement | null = null;
  rel = '';
  scrollLeft = 0;
  scrollWidth = 180;
  selectionEnd = 0;
  selectionStart = 0;
  tabIndex = 0;
  textContent = '';
  title = '';
  type = '';
  value = '';
  width = 180;
  focused = false;

  constructor(readonly tagName = 'div') {}

  readonly classList = {
    add: (...names: string[]) => this.setClasses([...this.classes(), ...names]),
    contains: (name: string) => this.classes().includes(name),
    remove: (...names: string[]) =>
      this.setClasses(this.classes().filter((name) => !names.includes(name))),
    toggle: (name: string, force?: boolean) => {
      const active = force ?? !this.classes().includes(name);
      const classes = this.classes().filter((value) => value !== name);
      if (active) classes.push(name);
      this.setClasses(classes);
      return active;
    },
  };

  get nextSibling(): FakeElement | null {
    if (!this.parentNode) return null;
    const index = this.parentNode.children.indexOf(this);
    return this.parentNode.children[index + 1] ?? null;
  }

  get parentElement() {
    return this.parentNode;
  }

  private classes() {
    return this.className.split(/\s+/).filter(Boolean);
  }

  private setClasses(classes: string[]) {
    this.className = [...new Set(classes)].join(' ');
  }

  private matches(selector: string): boolean {
    if (/^[a-z]+$/.test(selector)) {
      return this.tagName === selector;
    }
    if (selector === 'link[href="single-waveform-view-mode.css"]') {
      return this.tagName === 'link' && this.href === 'single-waveform-view-mode.css';
    }
    const notClass = /:not\(\.([^)]+)\)/.exec(selector)?.[1];
    const positiveSelector = selector.replace(/:not\([^)]+\)/g, '');
    const classNames = Array.from(positiveSelector.matchAll(/\.([\w-]+)/g), (match) => match[1]!);
    if (classNames.length) {
      return (
        classNames.every((name) => this.classList.contains(name)) &&
        (!notClass || !this.classList.contains(notClass))
      );
    }
    return false;
  }

  addEventListener(name: string, listener: Listener) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  append(...children: FakeElement[]) {
    for (const child of children) this.appendChild(child);
  }

  appendChild(child: FakeElement) {
    child.remove();
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  blur() {
    this.focused = false;
  }

  click() {
    this.dispatchEvent(new FakeEvent('click'));
  }

  closest(selector: string): FakeElement | null {
    if (this.matches(selector)) return this;
    return this.parentNode?.closest(selector) ?? null;
  }

  dispatchEvent(event: FakeEvent) {
    event.target ??= this;
    for (const listener of this.listeners.get(event.type) ?? []) listener(event);
    return !event.defaultPrevented;
  }

  focus() {
    this.focused = true;
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  getBoundingClientRect() {
    return { height: this.clientHeight, left: 0, top: 10, width: this.clientWidth };
  }

  getElementsByClassName(name: string) {
    return this.querySelectorAll(`.${name}`);
  }

  getElementsByTagName(name: string) {
    return this.querySelectorAll(name);
  }

  insertBefore(child: FakeElement, before: FakeElement) {
    child.remove();
    const index = this.children.indexOf(before);
    child.parentNode = this;
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    return child;
  }

  querySelector(selector: string): FakeElement | null {
    if (selector.includes('>')) {
      const [parentSelector, childSelector] = selector.split('>');
      const parent = this.querySelector(parentSelector!);
      return parent?.children.find((child) => child.matches(childSelector!)) ?? null;
    }
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
    if (name.startsWith('data-')) delete this.dataset[dataKey(name)];
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = value;
  }
}

class FakeCanvas extends FakeElement {
  constructor(readonly context: Record<string, unknown>) {
    super('canvas');
  }
  getContext() {
    return this.context;
  }
}

function dataKey(name: string) {
  return name.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function fakeCanvasContext() {
  const gradient = { addColorStop: () => undefined };
  return {
    beginPath: () => undefined,
    clearRect: () => undefined,
    clip: () => undefined,
    createLinearGradient: () => gradient,
    drawImage: () => undefined,
    fillRect: () => undefined,
    fillText: () => undefined,
    lineTo: () => undefined,
    moveTo: () => undefined,
    rect: () => undefined,
    restore: () => undefined,
    save: () => undefined,
    stroke: () => undefined,
    strokeRect: () => undefined,
  };
}

function fakeDocument() {
  const documentElement = new FakeElement('html');
  const head = new FakeElement('head');
  const body = new FakeElement('body');
  documentElement.append(head, body);
  const listeners = new Map<string, Listener[]>();
  return {
    activeElement: null,
    body,
    createElement: (tag: string) =>
      tag === 'canvas' ? new FakeCanvas(fakeCanvasContext()) : new FakeElement(tag),
    dispatchEvent: (event: FakeEvent) => {
      for (const listener of listeners.get(event.type) ?? []) listener(event);
      return true;
    },
    documentElement,
    fullscreenElement: null,
    getElementsByClassName: (name: string) => documentElement.getElementsByClassName(name),
    head,
    addEventListener: (name: string, listener: Listener) => {
      const group = listeners.get(name) ?? [];
      group.push(listener);
      listeners.set(name, group);
    },
    listeners,
    querySelector: (selector: string) => documentElement.querySelector(selector),
    querySelectorAll: (selector: string) => documentElement.querySelectorAll(selector),
    readyState: 'complete',
  };
}

class FakeMutationObserver {
  static instances: FakeMutationObserver[] = [];
  target: unknown;
  options: unknown;
  disconnected = false;

  constructor(readonly callback: () => void) {
    FakeMutationObserver.instances.push(this);
  }

  disconnect() {
    this.disconnected = true;
  }

  observe(target: unknown, options: unknown) {
    this.target = target;
    this.options = options;
  }
}

function frameQueue() {
  const frames: Array<() => void> = [];
  return {
    frames,
    flush(limit = 20) {
      let count = 0;
      while (frames.length && count < limit) {
        frames.shift()!();
        count += 1;
      }
    },
    request(callback: () => void) {
      frames.push(callback);
      return frames.length;
    },
  };
}

describe('Wave 2 generated presentation runtime', () => {
  it('registers the complete Russian dictionary and phrase rules', () => {
    let registration:
      | {
          locale: string;
          messages: Record<string, string>;
          options: { phrases: Array<[RegExp, string]> };
        }
      | undefined;
    const runtimeWindow = {
      AMI18n: {
        register(
          locale: string,
          messages: Record<string, string>,
          options: { phrases: Array<[RegExp, string]> },
        ) {
          registration = { locale, messages, options };
        },
      },
    };
    runInNewContext(asset('locale-ru.js'), { window: runtimeWindow });
    expect(registration?.locale).toBe('ru');
    expect(Object.keys(registration!.messages)).toHaveLength(229);
    expect(registration?.messages).toMatchObject({
      Settings: 'Настройки',
      'Create a new marker': 'Создать новый маркер',
      'Rename selected audio clip': 'Задать имя выбранной карточке звука',
      'Composition waveform overview': 'Общий waveform композиции',
    });
    expect('Channel 12'.replace(...registration!.options.phrases[0]!)).toBe('Канал 12');
  });

  it('preserves welcome persistence and settings renderer refresh behavior', () => {
    const document = fakeDocument();
    const toolbarContent = new FakeElement('div');
    toolbarContent.className = 'pk_tbc';
    toolbarContent.scrollWidth = 400;
    toolbarContent.clientWidth = 200;
    const editorUi = new FakeElement('div');
    editorUi.append(toolbarContent);
    const modalCancel = new FakeElement('button');
    modalCancel.className = 'pk_modal_cancel';
    document.body.append(modalCancel);
    const timers: Array<{ callback: () => void; delay: number }> = [];
    const preferences = new Map<string, unknown>();
    let shown = 0;
    let capturedOptions: Record<string, unknown> | undefined;
    class Modal {
      readonly el_body = new FakeElement('div');
      readonly els = { bottom: [] as FakeElement[] };
      constructor(options: Record<string, unknown>) {
        capturedOptions = options;
        this.el_body.append(new FakeElement('div'));
      }
      Destroy() {}
      Show() {
        shown += 1;
      }
    }
    const editor = {
      _deps: {},
      el: document.body,
      isMobile: false,
      ui: { el: editorUi, InteractionHandler: {}, KeyHandler: {} },
    };
    const runtimeWindow = {
      AMPreferences: {
        get: <Value>(key: string, fallback: Value) =>
          (preferences.has(key) ? preferences.get(key) : fallback) as Value,
        set: <Value>(key: string, value: Value) => {
          preferences.set(key, value);
          return value;
        },
      },
      location: { search: '' },
      setTimeout: (callback: () => void, delay: number) => {
        timers.push({ callback, delay });
        return timers.length;
      },
    } as Record<string, unknown>;
    const fakeMath = Object.create(Math) as Math;
    fakeMath.random = () => 0;
    runInNewContext(asset('welcome-service.js'), {
      Math: fakeMath,
      PKAudioEditor: editor,
      PKSimpleModal: Modal,
      document,
      window: runtimeWindow,
    });
    expect(timers[0]?.delay).toBe(320);
    timers[0]!.callback();
    expect(preferences.get('welcomeSeen')).toBe(true);
    expect(editor._deps).toHaveProperty('Wlc');
    expect(shown).toBe(1);
    expect(capturedOptions).toHaveProperty(
      'title',
      '<font style="font-size:15px">Welcome to AM</font>',
    );

    const header = new FakeElement('header');
    header.className = 'pk_hdr';
    document.body.append(header);
    const colors: Record<string, string> = {
      'wave-color': '#123456',
      'wave-progress': '#654321',
      ring: '#abcdef',
    };
    const applied: string[] = [];
    const editorEvents: string[] = [];
    const opened: string[] = [];
    Object.assign(runtimeWindow, {
      AMAppearance: { open: (tab: string) => opened.push(tab) },
      AMTheme: { color: (name: string) => colors[name] },
      PKAudioEditor: {
        engine: {
          wavesurfer: {
            backend: { buffer: { length: 1 } },
            drawBuffer: () => applied.push('draw'),
            params: {},
            setCursorColor: (value: string) => applied.push(`cursor:${value}`),
            setProgressColor: (value: string) => applied.push(`progress:${value}`),
            setWaveColor: (value: string) => applied.push(`wave:${value}`),
          },
        },
        fireEvent: (name: string) => editorEvents.push(name),
      },
      addEventListener: () => undefined,
      dispatchEvent: () => true,
      requestAnimationFrame: (callback: () => void) => {
        callback();
        return 1;
      },
    });
    runInNewContext(asset('settings-trigger-service.js'), {
      Event: FakeEvent,
      MutationObserver: FakeMutationObserver,
      document,
      window: runtimeWindow,
    });
    const settingsButton = header.querySelector('.am_settings_entry>button')!;
    expect(settingsButton.textContent).toBe('Settings');
    settingsButton.click();
    expect(opened).toEqual(['themes']);
    expect(applied).toEqual([
      'wave:#123456',
      'progress:#654321',
      'cursor:#abcdef',
      'draw',
      'wave:#123456',
      'progress:#654321',
      'cursor:#abcdef',
      'draw',
    ]);
    expect(editorEvents).toContain('RequestResize');
  });

  it('creates marker and clip rename toolbar actions with compatible editor events', () => {
    const document = fakeDocument();
    const appRoot = new FakeElement('main');
    const toolbar = new FakeElement('div');
    toolbar.className = 'pk_tb';
    const selection = new FakeElement('div');
    selection.className = 'pk_selection';
    toolbar.append(selection);
    appRoot.append(toolbar);
    document.body.append(appRoot);
    const frames = frameQueue();
    const callbacks = new Map<string, (value?: unknown) => void>();
    const fired: Array<[string, unknown]> = [];
    const notifications: Array<[string, number | undefined]> = [];
    let modalOptions: {
      buttons?: Array<{ callback(instance: FakeModal): void }>;
      title?: string;
    } = {};
    class FakeModal {
      readonly el = new FakeElement('div');
      readonly el_body = new FakeElement('div');
      readonly els = { bottom: [new FakeElement('button')] };
      destroyed = false;
      constructor(options: typeof modalOptions) {
        modalOptions = options;
        const input = new FakeElement('input');
        this.el.append(input);
        this.el_body.append(input);
      }
      Destroy() {
        this.destroyed = true;
      }
      Show() {}
    }
    const app = {
      _deps: {},
      el: appRoot,
      engine: { wavesurfer: { backend: { buffer: { length: 1 } }, getDuration: () => 10 } },
      fireEvent: (name: string, value?: unknown) => fired.push([name, value]),
      listenFor: (name: string, callback: (value?: unknown) => void) =>
        callbacks.set(name, callback),
      multitrack: { HasClips: () => true, IsOn: () => true, getState: () => ({ clips: 1 }) },
      ui: { InteractionHandler: {}, KeyHandler: {} },
    };
    const runtimeWindow = {
      OneUp: (message: string, duration?: number) => notifications.push([message, duration]),
      requestAnimationFrame: frames.request,
      setTimeout: () => 1,
    };
    const sandbox = {
      MutationObserver: FakeMutationObserver,
      PKSimpleModal: FakeModal,
      document,
      window: runtimeWindow,
    };
    runInNewContext(asset('marker-toolbar-service.js'), sandbox);
    (
      runtimeWindow as unknown as { AMInstallMarkerCreateButton(app: unknown): void }
    ).AMInstallMarkerCreateButton(app);
    frames.flush();
    const markerButton = toolbar.querySelector('.pk_marker_add_btn')!;
    expect(markerButton.classList.contains('pk_disabled')).toBe(false);
    markerButton.click();
    expect(modalOptions.title).toBe('New marker');
    const markerOptions = modalOptions;
    const markerModal = new FakeModal({});
    markerModal.el_body.querySelector('input')!.value = 'Mark\n1';
    markerOptions.buttons![0]!.callback(markerModal);
    expect(fired).toContainEqual(['MrkrAdd', { name: 'Mark 1' }]);

    const clipNode = new FakeElement('div');
    clipNode.className = 'pk_mt_clip pk_mt_clip_sel';
    clipNode.setAttribute('data-clip', 'clip-1');
    const clipLabel = new FakeElement('span');
    clipNode.append(clipLabel);
    appRoot.append(clipNode);
    runInNewContext(asset('clip-rename-toolbar-service.js'), sandbox);
    (
      runtimeWindow as unknown as { AMInstallClipRenameButton(app: unknown): void }
    ).AMInstallClipRenameButton(app);
    frames.flush();
    callbacks.get('DidSelectClip')?.({ id: 'clip-1', name: 'Audio' });
    frames.flush();
    const renameButton = toolbar.querySelector('.pk_clip_rename_btn')!;
    expect(renameButton.classList.contains('pk_disabled')).toBe(false);
    renameButton.click();
    expect(modalOptions.title).toBe('Clip name');
    const renameOptions = modalOptions;
    const renameModal = new FakeModal({});
    renameModal.el_body.querySelector('input')!.value = '  Lead   Vocal  ';
    renameOptions.buttons![0]!.callback(renameModal);
    expect(clipLabel.textContent).toBe('Lead Vocal');
    expect(fired.map(([name]) => name)).toEqual(
      expect.arrayContaining(['StateRequestPush', 'DidSelectClip', 'DidUpdateMultitrack']),
    );
    expect(notifications).toContainEqual(['Clip renamed', 900]);
  });

  it('installs the composition badge and centers the multitrack cursor', () => {
    const document = fakeDocument();
    const toolbar = new FakeElement('div');
    toolbar.className = 'pk_tb';
    const selection = new FakeElement('div');
    selection.className = 'pk_selection';
    toolbar.append(selection);
    document.body.append(toolbar);
    const frames = frameQueue();
    const events: string[] = [];
    const runtimeWindow = {
      PKAudioEditor: {
        fireEvent: (name: string) => events.push(name),
        multitrack: { IsOn: () => true },
      },
      devicePixelRatio: 1,
      requestAnimationFrame: frames.request,
    };
    runInNewContext(asset('composition-waveform-service.js'), { document, window: runtimeWindow });
    const badge = toolbar.querySelector('.pk_comp_wave_badge')!;
    expect(badge.getAttribute('aria-label')).toBe('Composition waveform overview');
    expect(badge.querySelector('canvas')).not.toBeNull();
    expect(frames.frames).toHaveLength(1);
    badge.click();
    expect(events).toEqual(['RequestViewCenterToCursor']);
  });

  it('keeps multitrack timeline growth bounded and patches ruler drawing', () => {
    const document = fakeDocument();
    const appRoot = new FakeElement('main');
    const main = new FakeElement('div');
    const lanes = new FakeElement('div');
    const ruler = new FakeElement('div');
    main.className = 'pk_mt_main';
    lanes.className = 'pk_mt_lanes';
    ruler.className = 'pk_mt_ruler';
    main.clientWidth = 1000;
    const clip = new FakeElement('div');
    clip.className = 'pk_mt_clip';
    clip.style.left = '600px';
    clip.style.width = '400px';
    clip.offsetWidth = 400;
    lanes.append(clip);
    appRoot.append(main, lanes, ruler);
    document.body.append(appRoot);
    const frames = frameQueue();
    const drawCalls: number[][] = [];
    const editor = {
      _deps: {},
      el: appRoot,
      ui: {
        drawTimelineRuler: (
          _context: unknown,
          total: number,
          width: number,
          left: number,
          visible: number,
        ) => drawCalls.push([total, width, left, visible]),
      },
    };
    const runtimeWindow = {
      addEventListener: () => undefined,
      requestAnimationFrame: frames.request,
    } as Record<string, unknown>;
    runInNewContext(asset('multitrack-scroll-service.js'), {
      MutationObserver: FakeMutationObserver,
      document,
      window: runtimeWindow,
    });
    const service = (
      runtimeWindow as {
        AMMultitrackScroll: {
          calculateVisualWidth(base: number, left: number, viewport: number): number;
          install(editor: unknown): void;
        };
      }
    ).AMMultitrackScroll;
    expect(service.calculateVisualWidth(1000, 5000, 1000)).toBe(2000);
    service.install(editor);
    frames.flush();
    editor.ui.drawTimelineRuler({}, 10, 1000, 0, 1000);
    expect(lanes.style.width).toBe('1830px');
    expect(ruler.style.width).toBe('1830px');
    expect(main.classList.contains('pk_mt_scroll_unified')).toBe(true);
    expect(drawCalls[0]?.[1]).toBe(1830);
  });

  it('decomposes single-waveform mode from touch clip selection while preserving both facades', () => {
    const document = fakeDocument();
    const appRoot = new FakeElement('main');
    appRoot.className = 'pk_app pk_mt_on';
    const toolbar = new FakeElement('div');
    toolbar.className = 'pk_tb';
    const selection = new FakeElement('div');
    selection.className = 'pk_selection';
    toolbar.append(selection);
    appRoot.append(toolbar);
    document.body.append(appRoot);
    const preferences = new Map<string, unknown>();
    const runtimeWindow = {
      AMPreferences: {
        get: <Value>(key: string, fallback: Value) =>
          (preferences.has(key) ? preferences.get(key) : fallback) as Value,
        set: <Value>(key: string, value: Value) => {
          preferences.set(key, value);
          return value;
        },
      },
      addEventListener: () => undefined,
      clearInterval: () => undefined,
      setInterval: () => 1,
      setTimeout: () => 1,
    } as Record<string, unknown>;
    runInNewContext(asset('single-waveform-view-service.js'), {
      document,
      window: runtimeWindow,
    });
    const waveService = (
      runtimeWindow as {
        AMSingleWaveformView: {
          focusGain(x: number, width: number, channel: number): number;
          install(editor: unknown): void;
        };
      }
    ).AMSingleWaveformView;
    const editor = {
      _deps: {},
      el: appRoot,
      fireEvent: () => undefined,
      listenFor: () => undefined,
    };
    waveService.install(editor);
    const modeButton = toolbar.querySelector('.pk_wave_view_toggle')!;
    expect(appRoot.classList.contains('pk_single_wave_focus')).toBe(true);
    modeButton.click();
    expect(preferences.get('singleWaveformView')).toBe('normal');
    expect(appRoot.classList.contains('pk_single_wave_normal')).toBe(true);
    expect(waveService.focusGain(0, 100, 0)).toBeCloseTo(0.004);
    expect(waveService.focusGain(50, 100, 0)).toBeCloseTo(1);
    expect(waveService.focusGain(20, 100, 0)).toBeCloseTo(waveService.focusGain(80, 100, 0));

    class FakeMouseEvent extends FakeEvent {
      constructor(type: string, values: Record<string, unknown>) {
        super(type, values);
      }
    }
    runInNewContext(asset('touch-clip-selection-service.js'), {
      Element: FakeElement,
      MouseEvent: FakeMouseEvent,
      document,
      window: runtimeWindow,
    });
    const touchService = runtimeWindow as {
      AMInstallTouchClipSelectFix(editor: unknown): void;
      AMTouchClipSelection: { install(editor: unknown): void };
    };
    expect(touchService.AMInstallTouchClipSelectFix).toBe(
      touchService.AMTouchClipSelection.install,
    );
    touchService.AMInstallTouchClipSelectFix(editor);
    const clip = new FakeElement('div');
    clip.className = 'pk_mt_clip';
    appRoot.append(clip);
    const dispatched: FakeEvent[] = [];
    clip.addEventListener('mousedown', (event) => dispatched.push(event));
    const touch = {
      clientX: 10,
      clientY: 20,
      identifier: 7,
      screenX: 30,
      screenY: 40,
    };
    const start = new FakeEvent('touchstart', {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: clip,
      touches: [touch],
    });
    for (const listener of document.listeners.get('touchstart') ?? []) listener(start);
    expect(start.defaultPrevented).toBe(true);
    expect(dispatched[0]).toMatchObject({ type: 'mousedown', shiftKey: true });
  });
});
