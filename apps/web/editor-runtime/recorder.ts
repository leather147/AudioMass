(() => {
  interface RecorderBackend {
    buffer?: AudioBuffer;
    createSource(): void;
    getAudioContext(): AudioContext;
    source: AudioBufferSourceNode;
  }

  interface RecorderWaveSurfer {
    backend: RecorderBackend;
    DrawTemp(offset: number | null, buffers?: Float32Array[]): void;
  }

  interface RecorderApp {
    _deps: Record<string, unknown>;
    engine: { wavesurfer: RecorderWaveSurfer };
    fireEvent(name: string, value?: unknown): unknown;
  }

  interface RecorderDependencies extends Record<string, unknown> {
    rec?: new (app: RecorderApp) => AMRuntimeRecorder;
  }

  type RecordingEnd = (
    offset: number | null,
    buffers: Float32Array[] | null,
    done: () => void,
  ) => void;

  type RecorderWindow = Window & {
    AudioWorkletNode?: typeof AudioWorkletNode;
    OfflineAudioContext: typeof OfflineAudioContext;
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  };

  const runtimeWindow = window as RecorderWindow;
  const workletLoads = new WeakMap<AudioContext, Promise<void>>();

  class RuntimeRecorder implements AMRuntimeRecorder {
    private mediaSource: MediaStreamAudioSourceNode | null = null;
    private audioStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null;
    private recorderNode: AudioNode | null = null;
    private monitorNode: GainNode | null = null;
    private captureOptions: AMRuntimeCaptureOptions | null = null;
    private captureId = 0;
    private readonly bufferSize = 4096;
    private active = false;
    private starting = false;
    private stopping = false;
    private workletActive = false;
    private startingOffset = 0;
    private endingOffset = 0;
    private sampleRate = 0;
    private sourceSampleRate = 0;
    private temporaryBuffers: Float32Array[] = [];
    private temporaryBufferIndex = -1;
    private drawSamples = 0;
    private skipSamples = 0;
    private aggregate: Float32Array | null = null;
    private aggregateIndex = 0;
    private endRecording: RecordingEnd | null = null;
    private startRecording: (() => void) | null = null;
    private currentOffset = 0;
    private firstSkip = 8;

    constructor(private readonly app: RecorderApp) {}

    private reportError(error: Error | null, callback?: (error: Error | null) => void) {
      this.starting = false;
      this.stopCapture();
      if (callback) {
        callback(error);
        return;
      }
      this.app.fireEvent('ErrorRec');
      this.app.fireEvent('ShowError', error?.message || 'No recording device found');
    }

    private flushAggregate() {
      if (!this.aggregate || !this.aggregateIndex || !this.captureOptions?.ondata) return;
      this.captureOptions.ondata(this.aggregate.subarray(0, this.aggregateIndex).slice());
      this.aggregateIndex = 0;
    }

    private pushInput(input: Float32Array, owned = false) {
      const ondata = this.captureOptions?.ondata;
      if (!ondata || !input) return;
      const size = this.captureOptions?.chunkSize || this.bufferSize;
      if (input.length === size && !this.aggregateIndex) {
        ondata(owned ? input : input.slice());
        return;
      }
      if (!this.aggregate || this.aggregate.length !== size) {
        this.aggregate = new Float32Array(size);
      }
      for (let offset = 0; offset < input.length;) {
        const count = Math.min(size - this.aggregateIndex, input.length - offset);
        this.aggregate.set(input.subarray(offset, offset + count), this.aggregateIndex);
        this.aggregateIndex += count;
        offset += count;
        if (this.aggregateIndex === size) {
          ondata(this.aggregate);
          this.aggregate = new Float32Array(size);
          this.aggregateIndex = 0;
        }
      }
    }

    private connectNode() {
      if (!this.audioContext || !this.mediaSource || !this.recorderNode) return;
      this.monitorNode = this.audioContext.createGain();
      this.monitorNode.gain.value = 0;
      this.mediaSource.connect(this.recorderNode);
      this.recorderNode.connect(this.monitorNode);
      this.monitorNode.connect(this.audioContext.destination);
    }

    private startScriptNode() {
      if (!this.audioContext) return;
      this.scriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      this.recorderNode = this.scriptProcessor;
      this.workletActive = false;
      this.scriptProcessor.onaudioprocess = (event) => {
        this.pushInput(event.inputBuffer.getChannelData(0));
      };
      this.connectNode();
    }

    private startWorkletNode() {
      if (!this.audioContext || !runtimeWindow.AudioWorkletNode) return;
      const node = new runtimeWindow.AudioWorkletNode(this.audioContext, 'pk-recorder', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: { size: this.captureOptions?.chunkSize || this.bufferSize },
      });
      this.recorderNode = node;
      this.workletActive = true;
      node.port.onmessage = (event: MessageEvent<Float32Array | 0>) => {
        if (event.data !== 0) this.pushInput(event.data, true);
      };
      this.connectNode();
    }

    private loadWorklet() {
      const context = this.audioContext;
      if (!context?.audioWorklet || !runtimeWindow.AudioWorkletNode) return Promise.reject();
      let loading = workletLoads.get(context);
      if (!loading) {
        loading = context.audioWorklet.addModule('recorder-worklet.js');
        workletLoads.set(context, loading);
      }
      return loading;
    }

    startCapture(options: AMRuntimeCaptureOptions) {
      if (this.active || this.starting || this.stopping) return false;
      if (!navigator.mediaDevices?.getUserMedia || !options.ctx) {
        this.reportError(null, options.onerror);
        return false;
      }
      this.audioContext = options.ctx;
      void this.audioContext.resume?.();
      this.captureOptions = options;
      this.sourceSampleRate = this.audioContext.sampleRate;
      this.starting = true;
      this.aggregate = null;
      this.aggregateIndex = 0;
      const id = ++this.captureId;

      void navigator.mediaDevices
        .getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        })
        .then((stream) => {
          if (id !== this.captureId) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          this.audioStream = stream;
          this.mediaSource = this.audioContext?.createMediaStreamSource(stream) ?? null;
          return this.loadWorklet().then(
            () => this.startWorkletNode(),
            () => this.startScriptNode(),
          );
        })
        .then(() => {
          if (id !== this.captureId || !this.recorderNode) return;
          this.starting = false;
          this.active = true;
          this.captureOptions?.onstart?.();
        })
        .catch((error: unknown) => {
          if (id === this.captureId) {
            this.reportError(error instanceof Error ? error : null, options.onerror);
          }
        });
      return true;
    }

    private finishCapture(done?: () => void) {
      this.flushAggregate();
      if (this.scriptProcessor) this.scriptProcessor.onaudioprocess = null;
      if (this.recorderNode instanceof AudioWorkletNode) this.recorderNode.port.onmessage = null;
      for (const node of [this.recorderNode, this.monitorNode, this.mediaSource]) {
        try {
          node?.disconnect();
        } catch {
          // The node may already be disconnected by the browser.
        }
      }
      this.audioStream?.getTracks().forEach((track) => track.stop());
      this.mediaSource = null;
      this.audioStream = null;
      this.scriptProcessor = null;
      this.recorderNode = null;
      this.monitorNode = null;
      this.captureOptions = null;
      this.aggregate = null;
      this.aggregateIndex = 0;
      this.stopping = false;
      this.workletActive = false;
      done?.();
    }

    stopCapture(done?: () => void) {
      if (this.stopping) return;
      this.captureId += 1;
      this.starting = false;
      this.active = false;
      this.stopping = true;
      if (this.workletActive && this.recorderNode instanceof AudioWorkletNode) {
        const port = this.recorderNode.port;
        let finished = false;
        port.onmessage = (event: MessageEvent<Float32Array | 0>) => {
          if (event.data === 0) {
            if (finished) return;
            finished = true;
            this.finishCapture(done);
          } else {
            this.pushInput(event.data, true);
          }
        };
        port.postMessage(0);
        window.setTimeout(() => {
          if (finished) return;
          finished = true;
          this.finishCapture(done);
        }, 60);
        return;
      }
      this.finishCapture(done);
    }

    private receiveBuffer(samples: Float32Array) {
      if (this.skipSamples > 0) {
        this.skipSamples -= samples.length;
        return;
      }
      this.currentOffset += (samples.length / this.sourceSampleRate) * this.sampleRate;
      if (this.endingOffset <= this.currentOffset) {
        if (this.endingOffset > 0) this.stop();
        return;
      }
      this.temporaryBuffers[++this.temporaryBufferIndex] = samples;
      this.drawSamples += samples.length;
      if (this.temporaryBufferIndex === 0 || this.drawSamples >= this.bufferSize * 4) {
        requestAnimationFrame(() => {
          this.drawSamples = 0;
          this.app.engine.wavesurfer.DrawTemp(this.startingOffset, this.temporaryBuffers);
        });
      }
    }

    isActive() {
      return this.active || this.starting;
    }

    setEndingOffset(seconds: number) {
      this.endingOffset = seconds;
    }

    private async downsample(
      buffers: Float32Array[],
      sourceSampleRate: number,
      targetSampleRate: number,
    ) {
      const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const concatenated = new Float32Array(totalLength);
      let offset = 0;
      for (const buffer of buffers) {
        concatenated.set(buffer, offset);
        offset += buffer.length;
      }
      const OfflineContext =
        runtimeWindow.OfflineAudioContext || runtimeWindow.webkitOfflineAudioContext;
      if (!OfflineContext) throw new Error('OfflineAudioContext is unavailable');
      const sourceContext = new OfflineContext(1, totalLength, sourceSampleRate);
      const audioBuffer = sourceContext.createBuffer(1, totalLength, sourceSampleRate);
      audioBuffer.copyToChannel(concatenated, 0, 0);
      const outputContext = new OfflineContext(
        1,
        Math.ceil(audioBuffer.duration * targetSampleRate),
        targetSampleRate,
      );
      const source = outputContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputContext.destination);
      source.start(0);
      return (await outputContext.startRendering()).getChannelData(0);
    }

    start(
      offset: number,
      onEnd: (offset: number | null, buffers: Float32Array[] | null) => void,
      onStart?: () => void,
      requestedSampleRate?: number,
    ) {
      if (this.active || this.starting) return false;
      this.startingOffset = Number(offset) || 0;
      this.currentOffset = this.startingOffset;
      const backend = this.app.engine.wavesurfer.backend;
      this.audioContext = backend.getAudioContext();
      if (!this.audioContext) {
        this.app.fireEvent('ErrorRec');
        this.app.fireEvent('ShowError', 'No recording device found');
        return false;
      }
      if (this.audioContext.currentTime === 0) {
        backend.source.start(0);
        backend.source.stop(0);
        backend.createSource();
      }
      this.sampleRate =
        requestedSampleRate || backend.buffer?.sampleRate || this.audioContext.sampleRate;
      this.sourceSampleRate = this.audioContext.sampleRate;
      this.skipSamples = this.firstSkip * this.bufferSize;
      this.drawSamples = 0;
      this.startRecording = onStart ?? null;
      this.endRecording = (recordingOffset, buffers, done) => {
        if (!buffers || this.sourceSampleRate === this.sampleRate) {
          done();
          onEnd(recordingOffset, buffers);
          return;
        }
        void this.downsample(buffers, this.sourceSampleRate, this.sampleRate).then(
          (buffer) => {
            done();
            onEnd(recordingOffset, [buffer]);
          },
          () => {
            done();
            this.app.fireEvent('ShowError', 'Could not resample recording');
          },
        );
      };
      return this.startCapture({
        ctx: this.audioContext,
        chunkSize: this.bufferSize,
        ondata: (samples) => this.receiveBuffer(samples),
        onstart: () => this.startRecording?.(),
        onerror: (error) => {
          this.app.fireEvent('ErrorRec');
          this.app.fireEvent('ShowError', error?.message || 'No recording device found');
        },
      });
    }

    stop(cancel = false) {
      if (!this.active && !this.starting) return;
      this.stopCapture(() => {
        this.app.engine.wavesurfer.DrawTemp(null);
        const buffers = this.temporaryBuffers.length > 0 && !cancel ? this.temporaryBuffers : null;
        const offset = buffers ? this.startingOffset / this.sampleRate : null;
        this.endRecording?.(offset, buffers, () => undefined);
        this.sampleRate = 0;
        this.sourceSampleRate = 0;
        this.firstSkip = 8;
        this.drawSamples = 0;
        this.skipSamples = 0;
        this.temporaryBufferIndex = -1;
        this.startingOffset = 0;
        this.endingOffset = 0;
        this.temporaryBuffers = [];
        this.audioContext = null;
        this.endRecording = null;
        this.startRecording = null;
      });
    }
  }

  (PKAudioEditor._deps as RecorderDependencies).rec = RuntimeRecorder;
})();
