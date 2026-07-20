import type { Disposable, Dispose } from './types.js';

export function toDisposable(value: Disposable | Dispose): Disposable {
  return typeof value === 'function' ? { dispose: value } : value;
}

export class DisposableStack implements Disposable {
  private disposed = false;
  private readonly values: Disposable[] = [];

  add(value: Disposable | Dispose): Disposable {
    const disposable = toDisposable(value);
    if (this.disposed) void disposable.dispose();
    else this.values.push(disposable);
    return disposable;
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    const errors: unknown[] = [];
    for (const value of this.values.reverse()) {
      try {
        await value.dispose();
      } catch (error) {
        errors.push(error);
      }
    }
    this.values.length = 0;
    if (errors.length > 0) throw new AggregateError(errors, 'Plugin cleanup failed.');
  }
}
