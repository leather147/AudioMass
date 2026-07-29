export {
  applyGain,
  assertValidPcm,
  clonePcm,
  deinterleave,
  fade,
  interleave,
  normalize,
  pcmDuration,
  reverse,
  trim,
} from './pcm.js';
export { extractWaveformPeaks } from './peaks.js';
export {
  applyAudioBufferGains,
  clampPlaybackRate,
  createChannelGainGraph,
  createFadeCurve,
  createGainGraph,
  measurePeaks,
  measureRms,
  normalizePlaybackRate,
  peakNormalizationGains,
  playbackDuration,
  playbackRateAt,
  rmsNormalizationGains,
  schedulePlaybackRate,
  setChannelGains,
  setGain,
} from './effects.js';
export type {
  ChannelGainGraph,
  ChannelLevel,
  PeakNormalizationStats,
  PlaybackRate,
  PlaybackRatePoint,
  PlaybackRateProfile,
  RmsNormalizationStats,
} from './effects.js';
export {
  createSilence,
  extractPcmRange,
  insertPcm,
  overwritePcmRange,
  removePcmRange,
  replacePcmAt,
} from './editing.js';
export type { PcmTimeRange } from './editing.js';
