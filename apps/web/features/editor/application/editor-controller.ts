import {
  AudioExportService,
  EditorSession,
  FrequencyAnalysisWorkerClient,
  PeakWorkerClient,
  WavEncoderWorkerClient,
  type AudioBinaryEncoder,
  type EditorCommand,
  type EditorSessionSnapshot,
  type EffectValues,
  type FrequencyAnalysis,
  type FrequencyAnalysisOptions,
  type PcmAudio,
  type SpecializedEffectWorkflow,
  type WaveformAnalysis,
  type WavBitDepth,
} from '@audiomass/audio-engine';

import {
  BrowserAudioDownloadAdapter,
  type AudioDownloadPort,
} from '../infrastructure/browser-audio-download';

export type WavEncoderFactory = () => AudioBinaryEncoder & { destroy(): void };

export interface WaveformAnalysisPort {
  destroy(): void;
  extractAnalysis(audio: PcmAudio, width: number): Promise<WaveformAnalysis>;
}

export type WaveformAnalysisFactory = () => WaveformAnalysisPort;

export interface FrequencyAnalysisPort {
  analyze(audio: PcmAudio, options?: FrequencyAnalysisOptions): Promise<FrequencyAnalysis>;
  destroy(): void;
}

export type FrequencyAnalysisFactory = () => FrequencyAnalysisPort;

export class EditorController {
  private frequencyAnalysis: FrequencyAnalysisPort | null = null;
  private waveformAnalysis: WaveformAnalysisPort | null = null;

  public constructor(
    private readonly session: EditorSession = new EditorSession(),
    private readonly exports: AudioExportService = new AudioExportService(),
    private readonly downloads: AudioDownloadPort = new BrowserAudioDownloadAdapter(),
    private readonly createWavEncoder: WavEncoderFactory = () => new WavEncoderWorkerClient(),
    private readonly createWaveformAnalysis: WaveformAnalysisFactory = () => new PeakWorkerClient(),
    private readonly createFrequencyAnalysis: FrequencyAnalysisFactory = () =>
      new FrequencyAnalysisWorkerClient(),
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

  public extractWaveform(width: number): Promise<WaveformAnalysis | null> {
    const audio = this.session.getRenderedAudio();
    if (!audio) return Promise.resolve(null);
    this.waveformAnalysis ??= this.createWaveformAnalysis();
    return this.waveformAnalysis.extractAnalysis(audio, width);
  }

  public analyzeFrequency(options?: FrequencyAnalysisOptions): Promise<FrequencyAnalysis | null> {
    const audio = this.session.getRenderedAudio();
    if (!audio) return Promise.resolve(null);
    this.frequencyAnalysis ??= this.createFrequencyAnalysis();
    return this.frequencyAnalysis.analyze(audio, options);
  }

  public get supportedEffectIds(): readonly string[] {
    return this.session.supportedEffectIds;
  }

  public supportsEffect(effectId: string): boolean {
    return this.supportedEffectIds.some((supported) => supported === effectId);
  }

  public get supportedSpecializedEffectIds(): readonly string[] {
    return this.session.supportedSpecializedEffectIds;
  }

  public supportsSpecializedEffect(effectId: string): boolean {
    return this.supportedSpecializedEffectIds.some((supported) => supported === effectId);
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

  public async previewSpecializedEffect(workflow: SpecializedEffectWorkflow): Promise<void> {
    await this.session.dispatch({ name: 'specialized-effect.preview', workflow });
    await this.session.dispatch({ name: 'playback.play' });
  }

  public applySpecializedEffect(workflow: SpecializedEffectWorkflow): Promise<void> {
    return this.session.dispatch({ name: 'specialized-effect.apply', workflow });
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
    this.frequencyAnalysis?.destroy();
    this.frequencyAnalysis = null;
    this.waveformAnalysis?.destroy();
    this.waveformAnalysis = null;
    return this.session.close();
  }
}
