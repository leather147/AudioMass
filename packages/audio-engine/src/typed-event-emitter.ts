type Listener<Payload> = (payload: Payload) => void;

export class TypedEventEmitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<Events[keyof Events]>>>();

  on<Name extends keyof Events>(name: Name, listener: Listener<Events[Name]>): () => void {
    const listeners = this.listeners.get(name) ?? new Set<Listener<Events[keyof Events]>>();
    listeners.add(listener as Listener<Events[keyof Events]>);
    this.listeners.set(name, listeners);
    return () => this.off(name, listener);
  }

  off<Name extends keyof Events>(name: Name, listener: Listener<Events[Name]>): void {
    const listeners = this.listeners.get(name);
    listeners?.delete(listener as Listener<Events[keyof Events]>);
    if (listeners?.size === 0) this.listeners.delete(name);
  }

  protected emit<Name extends keyof Events>(name: Name, payload: Events[Name]): void {
    const listeners = this.listeners.get(name);
    if (!listeners) return;
    for (const listener of listeners) listener(payload);
  }

  protected removeAllListeners(): void {
    this.listeners.clear();
  }
}
