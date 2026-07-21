(() => {
  type WavBitDepth = 16 | 24 | 32;
  type WavSamples = Float32Array | Int16Array | Int32Array;

  type WavEncoder = {
    encode(
      samples: WavSamples,
      options: { bitDepth: WavBitDepth; channels: number; sampleRate: number },
    ): ArrayBuffer;
    interleave(left: WavSamples, right: WavSamples): WavSamples;
  };

  type WavWorkerConfig = {
    bit_depth?: number;
    channels: number;
    kbps?: number;
    sample_rate: number;
  };

  type WavWorkerGlobal = typeof globalThis & {
    AMWavEncoder?: WavEncoder;
    onmessage: ((event: MessageEvent<ArrayBuffer | WavWorkerConfig | null>) => void) | null;
    postMessage(message: unknown): void;
  };

  function createSampleArray(samples: WavSamples, length: number): WavSamples {
    const sampleType = Object.prototype.toString.call(samples);
    if (sampleType === '[object Float32Array]') return new Float32Array(length);
    if (sampleType === '[object Int32Array]') return new Int32Array(length);
    return new Int16Array(length);
  }

  function interleave(left: WavSamples, right: WavSamples): WavSamples {
    if (left.constructor !== right.constructor || left.length !== right.length) {
      throw new Error('WAV channels must use the same sample format and length.');
    }

    const output = createSampleArray(left, left.length + right.length);
    for (let inputIndex = 0, outputIndex = 0; inputIndex < left.length; inputIndex += 1) {
      output[outputIndex] = left[inputIndex]!;
      output[outputIndex + 1] = right[inputIndex]!;
      outputIndex += 2;
    }
    return output;
  }

  function writeString(view: DataView, offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  function encode(
    samples: WavSamples,
    options: { bitDepth: WavBitDepth; channels: number; sampleRate: number },
  ) {
    const { bitDepth, channels, sampleRate } = options;
    const bytesPerSample = bitDepth / 8;
    const dataLength = samples.length * bytesPerSample;
    const isFloat = bitDepth === 32;
    const formatSize = isFloat ? 18 : 16;
    const factSize = isFloat ? 12 : 0;
    const totalSize = 12 + 8 + formatSize + factSize + 8 + dataLength;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(view, 8, 'WAVE');

    let offset = 12;
    writeString(view, offset, 'fmt ');
    view.setUint32(offset + 4, formatSize, true);
    view.setUint16(offset + 8, isFloat ? 3 : 1, true);
    view.setUint16(offset + 10, channels, true);
    view.setUint32(offset + 12, sampleRate, true);
    view.setUint32(offset + 16, sampleRate * channels * bytesPerSample, true);
    view.setUint16(offset + 20, channels * bytesPerSample, true);
    view.setUint16(offset + 22, bitDepth, true);
    if (isFloat) view.setUint16(offset + 24, 0, true);
    offset += 8 + formatSize;

    if (isFloat) {
      writeString(view, offset, 'fact');
      view.setUint32(offset + 4, 4, true);
      view.setUint32(offset + 8, samples.length / channels, true);
      offset += 12;
    }

    writeString(view, offset, 'data');
    view.setUint32(offset + 4, dataLength, true);
    offset += 8;

    if (bitDepth === 16) {
      for (const sample of samples) {
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    } else if (bitDepth === 24) {
      for (const sample of samples) {
        view.setUint8(offset, sample & 0xff);
        view.setUint8(offset + 1, (sample >> 8) & 0xff);
        view.setUint8(offset + 2, (sample >> 16) & 0xff);
        offset += 3;
      }
    } else {
      for (const sample of samples) {
        view.setFloat32(offset, sample, true);
        offset += 4;
      }
    }

    return buffer;
  }

  function isConfig(data: ArrayBuffer | WavWorkerConfig): data is WavWorkerConfig {
    return 'sample_rate' in data;
  }

  function sampleArray(buffer: ArrayBuffer, bitDepth: WavBitDepth): WavSamples {
    if (bitDepth === 32) return new Float32Array(buffer);
    if (bitDepth === 24) return new Int32Array(buffer);
    return new Int16Array(buffer);
  }

  const encoder: WavEncoder = { encode, interleave };
  const worker = globalThis as WavWorkerGlobal;
  worker.AMWavEncoder = encoder;

  let sampleRate = 44_100;
  let channels = 1;
  let bitDepth: WavBitDepth = 16;
  let leftBuffer: ArrayBuffer | null = null;

  worker.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (isConfig(data)) {
      sampleRate = Number(data.sample_rate);
      channels = Number(data.channels);
      const requestedDepth = Number(data.bit_depth) || 16;
      bitDepth = requestedDepth === 24 || requestedDepth === 32 ? requestedDepth : 16;
      leftBuffer = null;
      return;
    }

    if (!leftBuffer) {
      leftBuffer = data;
      if (channels > 1) return;
    }

    const activeLeftBuffer = leftBuffer;
    if (!activeLeftBuffer) return;
    const left = sampleArray(activeLeftBuffer, bitDepth);
    const right = channels > 1 ? sampleArray(data, bitDepth) : null;
    const samples = right ? interleave(left, right) : left;
    const encoded = encode(samples, { bitDepth, channels, sampleRate });
    worker.postMessage(new Blob([encoded], { type: 'audio/wav' }));
    leftBuffer = null;
  };
})();
