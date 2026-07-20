export type AudioEngineErrorCode =
  | 'AUDIO_CONTEXT_UNAVAILABLE'
  | 'AUDIO_DECODE_FAILED'
  | 'BUFFER_NOT_LOADED'
  | 'ENGINE_CLOSED'
  | 'INVALID_AUDIO_DATA'
  | 'SHARED_MEMORY_UNAVAILABLE';

export class AudioEngineError extends Error {
  readonly code: AudioEngineErrorCode;

  constructor(code: AudioEngineErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AudioEngineError';
    this.code = code;
  }
}
