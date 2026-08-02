import {
  RECORDER_PROCESSOR_NAME,
  type RecorderChunkMessage,
  type RecorderFlushedMessage,
  type RecorderFlushCommand,
} from '../recording/recorder-protocol.js';

interface RecorderProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions?: { chunkSize?: number };
}

class AudioMassRecorderProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private done = false;
  private index = 0;

  public constructor(options: RecorderProcessorOptions = {}) {
    super();
    this.buffer = new Float32Array(options.processorOptions?.chunkSize ?? 4096);
    this.port.onmessage = (event: MessageEvent<RecorderFlushCommand>) => {
      if (event.data.type === 'flush') this.flush();
    };
  }

  public override process(inputs: Float32Array[][]): boolean {
    if (this.done) return false;
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    for (let offset = 0; offset < channel.length;) {
      const count = Math.min(this.buffer.length - this.index, channel.length - offset);
      this.buffer.set(channel.subarray(offset, offset + count), this.index);
      this.index += count;
      offset += count;
      if (this.index === this.buffer.length) this.postBuffer();
    }
    return true;
  }

  private postBuffer(): void {
    const samples = this.buffer.subarray(0, this.index).slice();
    this.buffer = new Float32Array(this.buffer.length);
    this.index = 0;
    const message: RecorderChunkMessage = { samples: samples.buffer, type: 'chunk' };
    this.port.postMessage(message, [samples.buffer]);
  }

  private flush(): void {
    this.done = true;
    if (this.index > 0) this.postBuffer();
    const message: RecorderFlushedMessage = { type: 'flushed' };
    this.port.postMessage(message);
  }
}

registerProcessor(RECORDER_PROCESSOR_NAME, AudioMassRecorderProcessor);

export {};
