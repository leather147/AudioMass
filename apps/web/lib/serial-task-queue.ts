export interface SerialTaskQueue<Value> {
  enqueue(value: Value): Promise<void>;
}

export function createSerialTaskQueue<Value>(
  handler: (value: Value) => Promise<void>,
): SerialTaskQueue<Value> {
  let tail = Promise.resolve();

  return {
    enqueue(value) {
      const task = tail.then(() => handler(value));
      tail = task.catch(() => undefined);
      return task;
    },
  };
}
