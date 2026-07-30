export { AudioEngine } from './audio-engine.js';
export {
  amplitudeToDb,
  analyzeLoudness,
  BS1770_BLOCK,
  gainForLoudnessTarget,
} from './analysis/loudness.js';
export { analyzeTempo, estimateTempo } from './analysis/tempo.js';
export { AudioEngineError } from './errors.js';
export { AudioWorkletRegistry } from './audio-worklet-registry.js';
export { encodePcmAsWav, encodeWav, interleaveWavChannels } from './codecs/wav.js';
export { EditorSession } from './application/editor-session.js';
export { AudioExportService } from './application/export-audio.js';
export { executeSingleTrackEdit } from './application/single-track-edit.js';
export { executeEffectEdit } from './application/effect-edit.js';
export { EFFECT_SCHEMAS, getEffectSchema } from './effects/catalog.js';
export { EffectProcessorRegistry, NATIVE_EFFECT_PROCESSOR_IDS } from './effects/processing.js';
export {
  defaultEffectValues,
  effectSchemaById,
  parseEffectValues,
  validateEffectSchema,
} from './effects/schema.js';
export {
  createEffectPreset,
  deserializeEffectPresetDocument,
  EFFECT_PRESET_FORMAT,
  EFFECT_PRESET_VERSION,
  effectPresetsFor,
  emptyEffectPresetDocument,
  migrateLegacyEffectPresets,
  parseEffectPresetDocument,
  removeEffectPreset,
  serializeEffectPresetDocument,
  upsertEffectPreset,
} from './effects/presets.js';
export { EditHistory } from './domain/edit-history.js';
export {
  readAudioMetadata,
  readId3Metadata,
  readMp4Metadata,
  writeId3Metadata,
} from './metadata/audio-metadata.js';
export {
  AUDIO_PROJECT_FORMAT,
  AUDIO_PROJECT_VERSION,
  deserializeAudioProject,
  parseAudioProject,
  serializeAudioProject,
} from './domain/project-codec.js';
export {
  clampTimelineTime,
  createAudioMarker,
  sortAudioMarkers,
  updateAudioMarker,
} from './domain/markers.js';
export {
  createEditorDocument,
  normalizeDocumentName,
  normalizeEditorRange,
} from './domain/editor-document.js';
export { PeakWorkerClient } from './peak-worker-client.js';
export {
  activeTracks,
  addClip,
  addTrack,
  clipEnvelope,
  createAudioClip,
  createAudioTrack,
  moveClip,
  projectDuration,
  removeClip,
  updateClip,
  updateTrack,
} from './multitrack/project.js';
export { clipsAt } from './multitrack/scheduler.js';
export {
  clampMixerGain,
  clampPan,
  createMixerState,
  effectiveTrackGain,
  isTrackAudible,
  linearPanGains,
  MultitrackMixerGraph,
  updateMasterGain,
  updateMixerTrack,
} from './multitrack/mixer.js';
export {
  clipMixEnvelope,
  clipOverlap,
  createCrossfade,
  crossfadeKey,
  MINIMUM_CROSSFADE_SECONDS,
  normalizeCrossfades,
  toggleClipCrossfades,
} from './multitrack/crossfade.js';
export { bounceProject } from './multitrack/bounce.js';
export { AudioRecorder, mergeRecordedChunks } from './recording/audio-recorder.js';
export { RECORDER_PROCESSOR_NAME } from './recording/recorder-protocol.js';
export { SharedAudioRingBuffer } from './shared-ring-buffer.js';
export { TempoWorkerClient } from './workers/tempo-worker-client.js';
export { WavEncoderWorkerClient } from './workers/wav-encoder-client.js';
export type { SharedRingBufferDescriptor } from './shared-ring-buffer.js';
export type { LoudnessNormalization, LoudnessReport } from './analysis/loudness.js';
export type { AudioBufferView, TempoOptions, TempoResult } from './analysis/tempo.js';
export type {
  AudioEngineEvents,
  AudioEngineOptions,
  AudioEngineSnapshot,
  AudioEngineState,
  PcmAudio,
  WaveformPeaks,
} from './types.js';
export type { AudioBinaryEncoder, ExportedAudioFile } from './application/export-audio.js';
export type {
  EditorAudioEngine,
  EditorCommand,
  EditorDocument,
  EditorSessionEvents,
  EditorSessionSnapshot,
  EditorTimeRange,
} from './application/editor-session.js';
export type {
  SingleTrackEditCommand,
  SingleTrackEditContext,
  SingleTrackEditResult,
  SingleTrackEditorState,
} from './application/single-track-edit.js';
export type {
  ApplyEffectCommand,
  CancelEffectPreviewCommand,
  EffectCommand,
  EffectEditorState,
  PreviewEffectCommand,
} from './application/effect-edit.js';
export type { EditHistorySnapshot } from './domain/edit-history.js';
export type {
  BooleanEffectParameter,
  BuiltInEffectPreset,
  EffectParameter,
  EffectParameterValue,
  EffectSchema,
  EffectValues,
  NumberEffectParameter,
  NumberListEffectParameter,
  SelectEffectParameter,
  SelectEffectParameterOption,
} from './effects/schema.js';
export type { CreateEffectPreset, EffectPreset, EffectPresetDocument } from './effects/presets.js';
export type { NativeEffectProcessor, NativeEffectProcessorId } from './effects/processing.js';
export type { AudioMarker, CreateAudioMarker } from './domain/markers.js';
export type {
  AudioComment,
  AudioLyrics,
  AudioMetadata,
  AudioPicture,
} from './metadata/audio-metadata.js';
export type { SerializedAudioProject } from './domain/project-codec.js';
export type { WavBitDepth, WavEncodingOptions, WavSamples } from './codecs/wav.js';
export type {
  AudioRecorderEvents,
  AudioRecorderOptions,
  AudioRecording,
} from './recording/audio-recorder.js';
export type {
  RecorderChunkMessage,
  RecorderFlushCommand,
  RecorderFlushedMessage,
  RecorderProcessorMessage,
} from './recording/recorder-protocol.js';
export type {
  AudioClip,
  AudioProject,
  AudioTrack,
  CreateAudioClip,
  CreateAudioTrack,
} from './multitrack/project.js';
export type { ScheduledClip } from './multitrack/scheduler.js';
export type {
  MixerChannelGraph,
  MixerState,
  MixerTrackUpdate,
  StereoGains,
} from './multitrack/mixer.js';
export type { AudioCrossfade, ClipOverlap } from './multitrack/crossfade.js';
export type {
  AudioSourceRepository,
  BounceProjectOptions,
  BounceRange,
} from './multitrack/bounce.js';
export type { TempoAnalyzeRequest, TempoAnalyzeResponse } from './workers/tempo-worker-protocol.js';
export type { WavEncodeRequest, WavEncodeResponse } from './workers/wav-encoder-protocol.js';
