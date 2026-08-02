import { describe, expect, it, vi } from 'vitest';

import {
  EditorControllerLifetime,
  type ScheduleControllerClose,
} from '@/features/editor/state/editor-controller-lifetime';

describe('EditorControllerLifetime', () => {
  it('cancels the Strict Mode probe disposal and closes on the real unmount', async () => {
    const closeEditor = vi.fn(async () => undefined);
    const closeMultitrack = vi.fn(async () => undefined);
    const callbacks = new Map<number, () => void>();
    let nextHandle = 0;
    const schedule: ScheduleControllerClose = (callback) => {
      nextHandle += 1;
      callbacks.set(nextHandle, callback);
      return nextHandle;
    };
    const cancel = (handle: unknown) => callbacks.delete(Number(handle));
    const lifetime = new EditorControllerLifetime(
      [{ close: closeEditor }, { close: closeMultitrack }],
      schedule,
      cancel,
    );

    lifetime.mount();
    lifetime.unmount();
    lifetime.mount();
    expect(callbacks.size).toBe(0);
    expect(closeEditor).not.toHaveBeenCalled();

    lifetime.unmount();
    expect(callbacks.size).toBe(1);
    callbacks.get(nextHandle)?.();
    await Promise.resolve();

    expect(closeEditor).toHaveBeenCalledOnce();
    expect(closeMultitrack).toHaveBeenCalledOnce();
  });
});
