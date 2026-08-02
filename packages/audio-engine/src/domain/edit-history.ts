export interface EditHistorySnapshot<T> {
  canRedo: boolean;
  canUndo: boolean;
  present: T;
}

export class EditHistory<T> {
  private future: T[] = [];
  private past: T[] = [];
  private presentValue: T;

  public constructor(
    initialValue: T,
    private readonly capacity = 100,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('History capacity must be a positive integer.');
    }
    this.presentValue = initialValue;
  }

  public get snapshot(): EditHistorySnapshot<T> {
    return {
      canRedo: this.future.length > 0,
      canUndo: this.past.length > 0,
      present: this.presentValue,
    };
  }

  public commit(value: T): EditHistorySnapshot<T> {
    if (Object.is(value, this.presentValue)) return this.snapshot;
    this.past.push(this.presentValue);
    if (this.past.length > this.capacity) this.past.shift();
    this.presentValue = value;
    this.future = [];
    return this.snapshot;
  }

  public redo(): EditHistorySnapshot<T> {
    const next = this.future.pop();
    if (next === undefined) return this.snapshot;
    this.past.push(this.presentValue);
    this.presentValue = next;
    return this.snapshot;
  }

  public reset(value: T): EditHistorySnapshot<T> {
    this.past = [];
    this.future = [];
    this.presentValue = value;
    return this.snapshot;
  }

  public undo(): EditHistorySnapshot<T> {
    const previous = this.past.pop();
    if (previous === undefined) return this.snapshot;
    this.future.push(this.presentValue);
    this.presentValue = previous;
    return this.snapshot;
  }
}
