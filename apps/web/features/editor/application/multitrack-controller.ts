import {
  AudioExportService,
  MultitrackSession,
  WavEncoderWorkerClient,
  type AudioBinaryEncoder,
  type BounceRange,
  type MixerTrackUpdate,
  type MultitrackSessionSnapshot,
  type WavBitDepth,
} from '@audiomass/audio-engine';

import {
  BrowserAudioDownloadAdapter,
  type AudioDownloadPort,
} from '../infrastructure/browser-audio-download';
import { BrowserPcmDecoder, type PcmDecoderPort } from '../infrastructure/browser-pcm-decoder';
import {
  IndexedDbMultitrackProjectRepository,
  type MultitrackProjectRepository,
} from '../infrastructure/indexed-db-multitrack-repository';

export type MultitrackWavEncoderFactory = () => AudioBinaryEncoder & { destroy(): void };
export type MultitrackIdentifierFactory = () => string;

const TRACK_COLORS = ['#43e4dc', '#7aa2f7', '#bb9af7', '#e0af68', '#9ece6a', '#f7768e'] as const;

function defaultIdentifier(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

/** Next.js application controller for the native multitrack feature. */
export class MultitrackController {
  private sequence = 0;

  public constructor(
    private readonly session: MultitrackSession = new MultitrackSession(),
    private readonly decoder: PcmDecoderPort = new BrowserPcmDecoder(),
    private readonly exports: AudioExportService = new AudioExportService(),
    private readonly downloads: AudioDownloadPort = new BrowserAudioDownloadAdapter(),
    private readonly createWavEncoder: MultitrackWavEncoderFactory = () =>
      new WavEncoderWorkerClient(),
    private readonly createId: MultitrackIdentifierFactory = defaultIdentifier,
    private readonly projects: MultitrackProjectRepository = new IndexedDbMultitrackProjectRepository(),
  ) {}

  public get snapshot(): MultitrackSessionSnapshot {
    return this.session.snapshot;
  }

  public subscribe(listener: () => void): () => void {
    return this.session.on('statechange', listener);
  }

  public subscribeToErrors(listener: (error: Error) => void): () => void {
    return this.session.on('error', listener);
  }

  public async addFiles(files: readonly File[]): Promise<void> {
    for (const file of files) {
      const audio = await this.decoder.decode(await file.arrayBuffer());
      const id = this.createId();
      this.session.addSource({
        audio,
        clipId: `clip-${id}`,
        color: TRACK_COLORS[this.sequence % TRACK_COLORS.length],
        name: file.name,
        sourceId: `source-${id}`,
        trackId: `track-${id}`,
      });
      this.sequence += 1;
    }
  }

  public play(): Promise<void> {
    return this.session.play();
  }

  public pause(): void {
    this.session.pause();
  }

  public stop(): void {
    this.session.stop();
  }

  public seek(seconds: number): Promise<void> {
    return this.session.seek(seconds);
  }

  public updateTrack(trackId: string, update: MixerTrackUpdate): void {
    this.session.updateTrack(trackId, update);
  }

  public updateMasterGain(value: number): void {
    this.session.updateMasterGain(value);
  }

  public removeTrack(trackId: string): void {
    this.session.removeTrack(trackId);
  }

  public async downloadWav(bitDepth: WavBitDepth = 16, range?: BounceRange): Promise<void> {
    const audio = this.session.bounce({ range });
    if (!audio) throw new Error('Add audio tracks before exporting them.');
    const encoder = this.createWavEncoder();
    try {
      this.downloads.save(
        await this.exports.exportWav(audio, this.snapshot.project.name, encoder, bitDepth),
      );
    } finally {
      encoder.destroy();
    }
  }

  public async saveProject(): Promise<void> {
    await this.projects.save(this.session.createDocument());
  }

  public async restoreProject(): Promise<void> {
    const stored = await this.projects.get(this.snapshot.project.id);
    if (!stored) throw new Error('No saved multitrack project is available.');
    this.session.loadDocument(stored.document);
  }

  public async close(): Promise<void> {
    await Promise.all([this.session.close(), this.decoder.close()]);
    this.projects.close?.();
  }
}
