export const RECORDER_PROCESSOR_NAME = 'audiomass-recorder';

export interface RecorderChunkMessage {
  samples: ArrayBuffer;
  type: 'chunk';
}

export interface RecorderFlushedMessage {
  type: 'flushed';
}

export interface RecorderFlushCommand {
  type: 'flush';
}

export type RecorderProcessorMessage = RecorderChunkMessage | RecorderFlushedMessage;
