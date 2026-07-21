(() => {
  type PackedAudioBuffer = {
    channels: Float32Array[];
    length: number;
    sampleRate: number;
  };

  type EstimateRequest = {
    buffer: PackedAudioBuffer;
    id: string | number;
    opts?: { maxTempo?: number; minTempo?: number };
    type: 'estimate';
  };

  type TempoWorkerGlobal = typeof globalThis & {
    PKTempoEstimator: {
      estimate(
        buffer: ReturnType<typeof makeBuffer>,
        options?: EstimateRequest['opts'],
      ): Promise<unknown>;
    };
    importScripts(...urls: string[]): void;
    onmessage: ((event: MessageEvent<EstimateRequest>) => void) | null;
    postMessage(message: unknown): void;
  };

  function makeBuffer(data: PackedAudioBuffer) {
    return {
      duration: data.length / data.sampleRate,
      getChannelData(index: number) {
        return data.channels[index] ?? data.channels[0]!;
      },
      length: data.length,
      numberOfChannels: data.channels.length,
      sampleRate: data.sampleRate,
    };
  }

  const worker = globalThis as TempoWorkerGlobal;
  worker.importScripts('tempo-estimator.js?v=mt3');
  worker.onmessage = (event) => {
    const message = event.data;
    if (message?.type !== 'estimate') return;
    void worker.PKTempoEstimator.estimate(makeBuffer(message.buffer), message.opts).then(
      (result) => worker.postMessage({ id: message.id, result }),
      (error: unknown) =>
        worker.postMessage({
          error: error instanceof Error ? error.message : 'Could not estimate tempo.',
          id: message.id,
        }),
    );
  };
})();
