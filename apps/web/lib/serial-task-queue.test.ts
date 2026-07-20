import { describe, expect, it, vi } from 'vitest';

import { createSerialTaskQueue } from '@/lib/serial-task-queue';

describe('createSerialTaskQueue', () => {
  it('runs writes in submission order even when the first write is slow', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const completed: string[] = [];
    const handler = vi.fn(async (value: string) => {
      if (value === 'first') await firstGate;
      completed.push(value);
    });
    const queue = createSerialTaskQueue(handler);

    const first = queue.enqueue('first');
    const second = queue.enqueue('second');
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(completed).toEqual(['first', 'second']);
  });

  it('continues after a rejected write', async () => {
    const completed: string[] = [];
    const queue = createSerialTaskQueue(async (value: string) => {
      if (value === 'broken') throw new Error('network failure');
      completed.push(value);
    });

    await expect(queue.enqueue('broken')).rejects.toThrow('network failure');
    await expect(queue.enqueue('next')).resolves.toBeUndefined();
    expect(completed).toEqual(['next']);
  });
});
