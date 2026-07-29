import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

const output = join(process.cwd(), 'public', 'editor-assets');
const asset = (name: string) => readFileSync(join(output, name), 'utf8');

type RuntimeListener = (value?: unknown, value2?: unknown) => void;

describe('final editor runtime migration', () => {
  it('preserves the editor event bus and math helpers', () => {
    const localeChanges: string[] = [];
    const runtimeWindow = {
      AMI18n: {
        setLocale: (locale: string) => {
          localeChanges.push(locale);
          return true;
        },
      },
      PKAudioList: [],
      location: { href: 'https://example.test/editor', search: '' },
    } as Record<string, unknown>;
    runInNewContext(asset('app.js'), {
      document: {
        createElement: () => ({}),
        getElementById: () => null,
        head: { append: () => undefined },
      },
      innerHeight: 900,
      navigator: { userAgent: 'desktop' },
      window: runtimeWindow,
    });

    const editor = runtimeWindow.PKAudioEditor as {
      fadeGain(position: number): number;
      fireEvent(name: string, value?: unknown): unknown;
      listenFor(name: string, listener: RuntimeListener): void;
      setLanguage(locale: string): boolean;
      stopListeningFor(name: string, listener: RuntimeListener): boolean;
      wheelInfo(event: Record<string, unknown>): { pinch: boolean; x: number; y: number };
      wheelZoomFactor(delta: number): number;
    };
    const lateRuntimeValue = runtimeWindow.AMLateRuntimeValue as (name: string) => unknown;
    const LateServiceFacade = lateRuntimeValue('LateService') as {
      new (value: string): { value: string };
      label: string;
    };
    class LateService {
      static label = 'ready';

      constructor(readonly value: string) {}
    }
    runtimeWindow.LateService = LateService;
    expect(new LateServiceFacade('resolved')).toMatchObject({ value: 'resolved' });
    expect(LateServiceFacade.label).toBe('ready');

    const calls: string[] = [];
    const first = (value?: unknown) => calls.push(`first:${String(value)}`);
    const second = (value?: unknown) => calls.push(`second:${String(value)}`);
    editor.listenFor('Ready', first);
    editor.listenFor('Ready', second);
    editor.fireEvent('Ready', 7);
    expect(calls).toEqual(['first:7', 'second:7']);
    expect(editor.stopListeningFor('Ready', first)).toBe(true);
    editor.fireEvent('Ready', 8);
    expect(calls).toEqual(['first:7', 'second:7', 'second:8']);
    expect(
      editor.wheelInfo({
        ctrlKey: true,
        deltaMode: 1,
        deltaX: 0,
        deltaY: 2,
        shiftKey: true,
      }),
    ).toMatchObject({ pinch: true, x: 32, y: 0 });
    expect(editor.wheelZoomFactor(-100)).toBeGreaterThan(1);
    expect(editor.fadeGain(0.5)).toBe(0.25);
    expect(editor.setLanguage('en')).toBe(true);
    expect(localeChanges).toEqual(['en']);
  });

  it('keeps bounded undo and redo state transitions', () => {
    const listeners = new Map<string, RuntimeListener>();
    const fired: Array<[string, unknown?, unknown?]> = [];
    const app = {
      _deps: {} as Record<string, unknown>,
      engine: { wavesurfer: { backend: { buffer: 'current-buffer' } } },
      fireEvent: (name: string, value?: unknown, value2?: unknown) => {
        fired.push([name, value, value2]);
      },
      listenFor: (name: string, listener: RuntimeListener) => listeners.set(name, listener),
    };
    runInNewContext(asset('state.js'), { PKAudioEditor: app });

    const StateManager = app._deps.state as new (
      depth: number,
      editor: typeof app,
    ) => {
      getLastUndoState(): { data?: unknown; id?: number } | undefined;
    };
    const state = new StateManager(2, app);
    listeners.get('StateRequestPush')?.({ data: 'one' });
    listeners.get('StateRequestPush')?.({ data: 'two' });
    listeners.get('StateRequestPush')?.({ data: 'three' });
    expect(state.getLastUndoState()).toMatchObject({ data: 'three' });
    listeners.get('StateRequestUndo')?.();
    expect(fired.map(([name]) => name)).toContain('StateDidPop');
    listeners.get('StateRequestRedo')?.();
    expect(state.getLastUndoState()).toMatchObject({ data: 'current-buffer' });
    listeners.get('StateRequestClearAll')?.();
    expect(state.getLastUndoState()).toBeUndefined();
  });

  it('keeps chord and single-key callbacks isolated from editable targets', () => {
    const documentListeners = new Map<string, (event: Record<string, unknown>) => void>();
    const windowListeners = new Map<string, () => void>();
    class RuntimeElement {
      constructor(readonly tagName: string) {}
    }
    const editor = { _deps: {} as Record<string, unknown> };
    runInNewContext(asset('keys.js'), {
      HTMLElement: RuntimeElement,
      PKAudioEditor: editor,
      document: {
        addEventListener: (name: string, listener: (event: Record<string, unknown>) => void) =>
          documentListeners.set(name, listener),
      },
      navigator: { platform: 'Win32' },
      window: {
        addEventListener: (name: string, listener: () => void) =>
          windowListeners.set(name, listener),
      },
    });

    const KeyHandler = editor._deps.keyhandler as new () => {
      addCallback(name: string, callback: () => void, keys: number[]): void;
      addSingleCallback(name: string, callback: () => void, key: number): void;
      keyDown(key: number, event: Record<string, unknown>): void;
      keyPress(key: number, event: Record<string, unknown>): void;
      keyMap: Record<number, boolean>;
    };
    const keys = new KeyHandler();
    const calls: string[] = [];
    keys.addCallback('undo', () => calls.push('undo'), [17, 90]);
    keys.keyDown(17, {});
    keys.keyDown(90, {});
    keys.addSingleCallback('space', () => calls.push('space'), 32);
    keys.keyPress(32, { target: new RuntimeElement('INPUT') });
    keys.keyPress(32, { target: new RuntimeElement('DIV') });
    expect(calls).toEqual(['undo', 'space']);
    windowListeners.get('blur')?.();
    expect(keys.keyMap).toEqual({});
  });

  it('preserves the recorder worklet protocol and final-buffer flush', () => {
    type ProcessorConstructor = new (options?: unknown) => {
      port: { onmessage: (() => void) | null };
      process(inputs: Float32Array[][]): boolean;
    };

    const messages: unknown[] = [];
    let processorName = '';
    let Processor: ProcessorConstructor | null = null;

    class WorkletBase {
      readonly port = {
        onmessage: null as (() => void) | null,
        postMessage: (message: unknown) => messages.push(message),
      };
    }

    runInNewContext(asset('recorder-worklet.js'), {
      AudioWorkletProcessor: WorkletBase,
      Float32Array,
      registerProcessor: (name: string, implementation: typeof Processor) => {
        processorName = name;
        Processor = implementation;
      },
    });
    expect(processorName).toBe('pk-recorder');
    expect(Processor).not.toBeNull();
    const recorder = new (Processor as unknown as ProcessorConstructor)({
      processorOptions: { size: 4 },
    });
    expect(recorder.process([[new Float32Array([1, 2, 3, 4, 5])]])).toBe(true);
    recorder.port.onmessage?.();
    expect(Array.from(messages[0] as Float32Array)).toEqual([1, 2, 3, 4]);
    expect(Array.from(messages[1] as Float32Array)).toEqual([5]);
    expect(messages[2]).toBe(0);
    expect(recorder.process([[new Float32Array([6])]])).toBe(false);
  });
});
