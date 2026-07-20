import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it, vi } from 'vitest';

type MessageListener = (event: { data: unknown; origin: string; source: object }) => void;
type RuntimeEditor = {
  fireEvent(eventName: string): void;
  listenFor(eventName: string, callback: (payload?: unknown) => void): void;
};

describe('generated editor runtime bridge', () => {
  it('publishes one complete preference event for an atomic apply command', () => {
    const source = readFileSync(
      join(process.cwd(), 'public', 'editor-assets', 'next-bridge.js'),
      'utf8',
    );
    const parent = { postMessage: vi.fn() };
    let messageListener: MessageListener | undefined;
    let preferenceListener: (() => void) | undefined;
    let locale = 'ru';
    let theme = 'replicate';
    const runtimeWindow = {
      parent,
      location: { origin: 'https://editor.test' },
      AMPreferences: {
        onChange(callback: () => void) {
          preferenceListener = callback;
          return () => undefined;
        },
      },
      AMTheme: {
        get: () => ({ id: theme }),
        set(nextTheme: string) {
          theme = nextTheme;
          preferenceListener?.();
        },
      },
      AMI18n: {
        getLocale: () => locale,
        setLocale(nextLocale: string) {
          locale = nextLocale;
          preferenceListener?.();
        },
      },
      addEventListener(name: string, listener: MessageListener) {
        if (name === 'message') messageListener = listener;
      },
      setTimeout(callback: () => void) {
        callback();
        return 1;
      },
    };

    runInNewContext(source, { window: runtimeWindow });
    const editor = { fireEvent: vi.fn(), listenFor: vi.fn() };
    (
      runtimeWindow as typeof runtimeWindow & { AMInstallNextBridge(editor: RuntimeEditor): void }
    ).AMInstallNextBridge(editor);
    parent.postMessage.mockClear();

    messageListener?.({
      data: {
        channel: 'audiomass.editor.v1',
        command: 'preferences.apply',
        payload: { locale: 'en', theme: 'nord' },
      },
      origin: runtimeWindow.location.origin,
      source: parent,
    });

    expect(parent.postMessage).toHaveBeenCalledTimes(1);
    expect(parent.postMessage).toHaveBeenCalledWith(
      {
        channel: 'audiomass.editor.v1',
        event: 'preferences.changed',
        payload: { locale: 'en', theme: 'nord' },
      },
      runtimeWindow.location.origin,
    );
  });

  it('ignores commands from a different origin', () => {
    const source = readFileSync(
      join(process.cwd(), 'public', 'editor-assets', 'next-bridge.js'),
      'utf8',
    );
    const parent = { postMessage: vi.fn() };
    let messageListener: MessageListener | undefined;
    const runtimeWindow = {
      parent,
      location: { origin: 'https://editor.test' },
      addEventListener(name: string, listener: MessageListener) {
        if (name === 'message') messageListener = listener;
      },
      setTimeout: vi.fn(),
    };

    runInNewContext(source, { window: runtimeWindow });
    const editor = { fireEvent: vi.fn(), listenFor: vi.fn() };
    (
      runtimeWindow as typeof runtimeWindow & { AMInstallNextBridge(editor: RuntimeEditor): void }
    ).AMInstallNextBridge(editor);

    messageListener?.({
      data: { channel: 'audiomass.editor.v1', command: 'playback.play' },
      origin: 'https://attacker.test',
      source: parent,
    });

    expect(editor.fireEvent).not.toHaveBeenCalled();
  });
});
