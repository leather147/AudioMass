export interface AsyncCloseable {
  close(): Promise<void>;
}

export type ScheduleControllerClose = (callback: () => void) => unknown;
export type CancelControllerClose = (handle: unknown) => void;

const scheduleClose: ScheduleControllerClose = (callback) => setTimeout(callback, 0);
const cancelClose: CancelControllerClose = (handle) =>
  clearTimeout(handle as ReturnType<typeof setTimeout>);

/**
 * Defers disposal by one task so React Strict Mode's immediate effect
 * setup-cleanup-setup probe can retain the same controller instance. A real
 * unmount is not followed by another mount and therefore closes both graphs.
 */
export class EditorControllerLifetime {
  private pendingClose: unknown | null = null;

  public constructor(
    private readonly controllers: readonly AsyncCloseable[],
    private readonly schedule: ScheduleControllerClose = scheduleClose,
    private readonly cancel: CancelControllerClose = cancelClose,
  ) {}

  public mount(): void {
    if (this.pendingClose === null) return;
    this.cancel(this.pendingClose);
    this.pendingClose = null;
  }

  public unmount(): void {
    if (this.pendingClose !== null) return;
    this.pendingClose = this.schedule(() => {
      this.pendingClose = null;
      void Promise.allSettled(this.controllers.map((controller) => controller.close()));
    });
  }
}
