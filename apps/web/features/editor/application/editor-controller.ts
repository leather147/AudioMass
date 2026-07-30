import {
  AudioExportService,
  EditorSession,
  NATIVE_EFFECT_PROCESSOR_IDS,
  WavEncoderWorkerClient,
  type AudioBinaryEncoder,
  type EditorCommand,
  type EditorSessionSnapshot,
  type EffectValues,
  type WavBitDepth,
} from '@audiomass/audio-engine';

import {
  BrowserAudioDownloadAdapter,
  type AudioDownloadPort,
} from '../infrastructure/browser-audio-download';

export type WavEncoderFactory = () => AudioBinaryEncoder & { destroy(): void };

export class EditorController {
  public constructor(
    private readonly session: EditorSession = new EditorSession(),
    private readonly exports: AudioExportService = new AudioExportService(),
    private readonly downloads: AudioDownloadPort = new BrowserAudioDownloadAdapter(),
    private readonly createWavEncoder: WavEncoderFactory = () => new WavEncoderWorkerClient(),
  ) {}

  public get snapshot(): EditorSessionSnapshot {
    return this.session.snapshot;
  }

  public subscribe(listener: () => void): () => void {
    return this.session.on('statechange', listener);
  }

  public subscribeToErrors(listener: (error: Error) => void): () => void {
    return this.session.on('error', listener);
  }

  public async openFile(file: File): Promise<void> {
    await this.session.load(await file.arrayBuffer(), file.name);
  }

  public dispatch(command: EditorCommand): Promise<void> {
    return this.session.dispatch(command);
  }

  public get supportedEffectIds(): readonly string[] {
    return NATIVE_EFFECT_PROCESSOR_IDS;
  }

  public supportsEffect(effectId: string): boolean {
    return this.supportedEffectIds.some((supported) => supported === effectId);
  }

  public async previewEffect(effectId: string, values: EffectValues): Promise<void> {
    await this.session.dispatch({ effectId, name: 'effect.preview', values });
    await this.session.dispatch({ name: 'playback.play' });
  }

  public applyEffect(effectId: string, values: EffectValues): Promise<void> {
    return this.session.dispatch({ effectId, name: 'effect.apply', values });
  }

  public cancelEffectPreview(): Promise<void> {
    return this.session.dispatch({ name: 'effect.preview.cancel' });
  }

  public async downloadWav(bitDepth: WavBitDepth = 16): Promise<void> {
    const audio = this.session.getAudio();
    if (!audio) throw new Error('Load audio before exporting it.');
    const encoder = this.createWavEncoder();
    try {
      this.downloads.save(
        await this.exports.exportWav(audio, this.session.snapshot.document.name, encoder, bitDepth),
      );
    } finally {
      encoder.destroy();
    }
  }

  public close(): Promise<void> {
    return this.session.close();
  }
}
