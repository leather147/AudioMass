(() => {
  type SelectionRange = [start: number, end: number];

  type LegacyWaveSurfer = {
    ActiveChannels: ArrayLike<number>;
    SelectedChannelsLen: number;
    backend: {
      ac: BaseAudioContext;
      buffer: AudioBuffer;
    };
    drawBuffer(): void;
    getDuration(): number;
    loadDecodedBuffer(buffer: AudioBuffer): void;
  };

  type AudioBufferOperations = {
    copySegment(offsetSeconds: number, durationSeconds: number): AudioBuffer;
    insertFloatArrays(offsetSeconds: number, arrays: Float32Array[]): SelectionRange;
    insertSegment(offsetSeconds: number, buffer: AudioBuffer): SelectionRange;
    makeSilence(durationSeconds: number): AudioBuffer;
    overwriteSegment(
      offsetSeconds: number,
      durationSeconds: number,
      buffer: AudioBuffer,
    ): SelectionRange;
    replaceBuffer(buffer: AudioBuffer): void;
    replaceFloatArrays(offsetSeconds: number, arrays: Float32Array[]): SelectionRange;
    trim(offsetSeconds: number, durationSeconds: number, force?: boolean): AudioBuffer;
  };

  type BufferOperationsWindow = Window & {
    AMAudioBufferOperations?: {
      create(
        wavesurfer: LegacyWaveSurfer,
        onDurationChange: (duration: number) => void,
      ): AudioBufferOperations;
    };
  };

  function createOperations(
    wavesurfer: LegacyWaveSurfer,
    onDurationChange: (duration: number) => void,
  ): AudioBufferOperations {
    function loadDecoded(buffer: AudioBuffer) {
      wavesurfer.loadDecodedBuffer(buffer);
      onDurationChange(wavesurfer.getDuration());
    }

    function redrawSoon() {
      window.setTimeout(() => wavesurfer.drawBuffer(), 40);
    }

    function makeSilence(durationSeconds: number) {
      const original = wavesurfer.backend.buffer;
      return wavesurfer.backend.ac.createBuffer(
        original.numberOfChannels,
        durationSeconds * original.sampleRate,
        original.sampleRate,
      );
    }

    function copySegment(offsetSeconds: number, durationSeconds: number) {
      const original = wavesurfer.backend.buffer;
      const length = Math.trunc(durationSeconds * original.sampleRate);
      const offset = Math.trunc(offsetSeconds * original.sampleRate);
      const segment = wavesurfer.backend.ac.createBuffer(
        wavesurfer.SelectedChannelsLen,
        length,
        original.sampleRate,
      );

      let targetChannel = 0;
      for (let channel = 0; channel < wavesurfer.ActiveChannels.length; channel += 1) {
        if (wavesurfer.ActiveChannels[channel] === 0) continue;
        segment
          .getChannelData(targetChannel)
          .set(original.getChannelData(channel).slice(offset, length + offset));
        targetChannel += 1;
      }
      return segment;
    }

    function trim(offsetSeconds: number, durationSeconds: number, force = false) {
      const original = wavesurfer.backend.buffer;
      const length = Math.trunc(durationSeconds * original.sampleRate);
      const offset = Math.trunc(offsetSeconds * original.sampleRate);
      const segment = wavesurfer.backend.ac.createBuffer(
        force ? original.numberOfChannels : wavesurfer.SelectedChannelsLen,
        length,
        original.sampleRate,
      );
      let result: AudioBuffer;

      if (!force && wavesurfer.SelectedChannelsLen < original.numberOfChannels) {
        result = wavesurfer.backend.ac.createBuffer(
          original.numberOfChannels,
          original.length,
          original.sampleRate,
        );
        for (let channel = 0; channel < original.numberOfChannels; channel += 1) {
          const source = original.getChannelData(channel);
          const target = result.getChannelData(channel);
          if (wavesurfer.ActiveChannels[channel] === 0) {
            target.set(source);
            continue;
          }
          segment.getChannelData(0).set(source.slice(offset, offset + length));
          target.set(source.slice(0, offset));
          target.set(source.slice(offset + length), offset + length);
        }
      } else {
        result = wavesurfer.backend.ac.createBuffer(
          original.numberOfChannels,
          original.length - length,
          original.sampleRate,
        );
        for (let channel = 0; channel < original.numberOfChannels; channel += 1) {
          const source = original.getChannelData(channel);
          segment.getChannelData(channel).set(source.slice(offset, offset + length));
          const target = result.getChannelData(channel);
          target.set(source.slice(0, offset));
          target.set(source.slice(offset + length), offset);
        }
      }

      loadDecoded(result);
      return segment;
    }

    function insertSegment(offsetSeconds: number, buffer: AudioBuffer): SelectionRange {
      const original = wavesurfer.backend.buffer;
      const result = wavesurfer.backend.ac.createBuffer(
        original.numberOfChannels,
        original.length + buffer.length,
        original.sampleRate,
      );
      const offset = Math.trunc(offsetSeconds * original.sampleRate);

      for (let channel = 0; channel < original.numberOfChannels; channel += 1) {
        const source = original.getChannelData(channel);
        const target = result.getChannelData(channel);
        const inserted = buffer.getChannelData(buffer.numberOfChannels === 1 ? 0 : channel);
        if (wavesurfer.SelectedChannelsLen === 1 && wavesurfer.ActiveChannels[channel] === 0) {
          target.set(source);
          continue;
        }
        if (offset > 0) target.set(source.slice(0, offset));
        target.set(inserted, offset);
        if (offset < original.length + buffer.length) {
          target.set(source.slice(offset), offset + inserted.length);
        }
      }

      loadDecoded(result);
      return [offset / original.sampleRate, (offset + buffer.length) / original.sampleRate];
    }

    function writeFloatArrays(
      offsetSeconds: number,
      arrays: Float32Array[],
      insert: boolean,
    ): SelectionRange {
      const original = wavesurfer.backend.buffer;
      const arrayLength = arrays.length;
      const arraySamples = arrays[0]?.length ?? 0;
      const insertedLength = arraySamples * arrayLength;
      const offset = Math.trunc(offsetSeconds * original.sampleRate);
      const resultLength = insert
        ? original.length + insertedLength
        : Math.max(original.length, offset + insertedLength);
      const result = wavesurfer.backend.ac.createBuffer(
        original.numberOfChannels,
        resultLength,
        original.sampleRate,
      );

      for (let channel = 0; channel < original.numberOfChannels; channel += 1) {
        const source = original.getChannelData(channel);
        const target = result.getChannelData(channel);
        if (offset > 0) target.set(source.slice(0, offset));
        for (let chunk = 0; chunk < arrayLength; chunk += 1) {
          const samples = arrays[chunk];
          if (samples) target.set(samples, offset + chunk * arraySamples);
        }
        if (offset < original.length + insertedLength) {
          const sourceOffset = insert ? offset : offset + insertedLength;
          target.set(source.slice(sourceOffset), offset + insertedLength);
        }
      }

      loadDecoded(result);
      return [offset / original.sampleRate, (offset + insertedLength) / original.sampleRate];
    }

    const operations: AudioBufferOperations = {
      copySegment,
      insertFloatArrays: (offset, arrays) => writeFloatArrays(offset, arrays, true),
      insertSegment,
      makeSilence,
      overwriteSegment(offset, duration, buffer) {
        trim(offset, duration, true);
        const selection = insertSegment(offset, buffer);
        redrawSoon();
        return selection;
      },
      replaceBuffer(buffer) {
        loadDecoded(buffer);
        redrawSoon();
      },
      replaceFloatArrays: (offset, arrays) => writeFloatArrays(offset, arrays, false),
      trim,
    };
    return operations;
  }

  (window as BufferOperationsWindow).AMAudioBufferOperations = { create: createOperations };
})();
