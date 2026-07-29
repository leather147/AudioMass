interface RecorderProcessorOptions extends AudioWorkletNodeOptions {
  processorOptions?: { size?: number };
}

class AudioMassRecorderProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private index = 0;
  private done = false;

  constructor(options: RecorderProcessorOptions = {}) {
    super(options);
    this.buffer = new Float32Array(options.processorOptions?.size || 4096);
    this.port.onmessage = () => this.flush();
  }

  private flush() {
    this.done = true;
    if (this.index) {
      const finalBuffer = this.buffer.subarray(0, this.index).slice();
      this.index = 0;
      this.port.postMessage(finalBuffer, [finalBuffer.buffer]);
    }
    this.port.postMessage(0);
  }

  process(inputs: Float32Array[][]) {
    if (this.done) return false;
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    let buffer = this.buffer;
    let index = this.index;
    const length = buffer.length;
    for (let offset = 0; offset < channel.length;) {
      const count = Math.min(length - index, channel.length - offset);
      buffer.set(channel.subarray(offset, offset + count), index);
      index += count;
      offset += count;
      if (index === length) {
        this.port.postMessage(buffer, [buffer.buffer]);
        buffer = this.buffer = new Float32Array(length);
        index = 0;
      }
    }
    this.index = index;
    return true;
  }
}

registerProcessor('pk-recorder', AudioMassRecorderProcessor);
