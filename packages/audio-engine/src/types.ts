export type AudioEngineState = 'closed' | 'idle' | 'paused' | 'playing' | 'ready';

export interface AudioEngineOptions {
  contextFactory?: () => AudioContext;
  latencyHint?: AudioContextLatencyCategory | number;
  sampleRate?: number;
}

export interface AudioEngineSnapshot {
  duration: number;
  position: number;
  sampleRate: number | null;
  state: AudioEngineState;
  volume: number;
}

export interface AudioEngineEvents {
  ended: AudioEngineSnapshot;
  error: Error;
  loaded: AudioEngineSnapshot;
  position: AudioEngineSnapshot;
  statechange: AudioEngineSnapshot;
  volumechange: AudioEngineSnapshot;
}

export interface PcmAudio {
  channels: readonly Float32Array[];
  sampleRate: number;
}

export interface WaveformPeaks {
  length: number;
  max: Float32Array;
  min: Float32Array;
  samplesPerPixel: number;
}
