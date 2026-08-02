import {
  AudioExportService,
  EditorSession,
  type AudioEngineEvents,
  type AudioEngineSnapshot,
  type EditorAudioEngine,
  type ExportedAudioFile,
  type PcmAudio,
  type WavBitDepth,
} from '@audiomass/audio-engine';
import { describe, expect, it } from 'vitest';

import { EditorController } from '@/features/editor/application/editor-controller';

class FakeEngine implements EditorAudioEngine {
  public duration = 1;
  public snapshot: AudioEngineSnapshot = {
    duration: 1,
    position: 0,
    sampleRate: 4,
    state: 'ready',
    volume: 1,
  };
  private audio: PcmAudio = { channels: [Float32Array.from([0, 1, 0, -1])], sampleRate: 4 };

  public async close() {}
  public async load() {
    return this.snapshot;
  }
  public loadPcm(audio: PcmAudio) {
    this.audio = audio;
    return this.snapshot;
  }
  public on<Name extends keyof AudioEngineEvents>(
    _name: Name,
    _listener: (payload: AudioEngineEvents[Name]) => void,
  ) {
    return () => undefined;
  }
  public pause() {}
  public async play() {}
  public async seek() {}
  public setVolume() {}
  public stop() {}
  public toPcm() {
    return this.audio;
  }
}

describe('EditorController export boundary', () => {
  it('routes revision-scoped frequency analysis through a lazy disposable port', async () => {
    const session = new EditorSession(new FakeEngine());
    await session.load(new ArrayBuffer(0), 'spectrum.wav');
    let destroyed = false;
    let receivedFrames = 0;
    const controller = new EditorController(
      session,
      new AudioExportService(),
      { save: () => undefined },
      () => ({ destroy: () => undefined, encode: async () => new ArrayBuffer(0) }),
      () => ({
        destroy: () => undefined,
        extractAnalysis: async () => ({
          channels: [],
          overview: {
            length: 0,
            max: new Float32Array(0),
            min: new Float32Array(0),
            samplesPerPixel: 1,
          },
        }),
      }),
      () => ({
        analyze: async (audio, options) => {
          receivedFrames = options?.frameCount ?? 0;
          return {
            spectrogram: {
              duration: audio.channels[0]!.length / audio.sampleRate,
              frameCount: 2,
              frequencies: Float32Array.from([0, 2]),
              magnitudesDb: Float32Array.from([-120, -6, -120, -5]),
              times: Float32Array.from([0.25, 0.75]),
            },
            spectrum: {
              frequencies: Float32Array.from([0, 2]),
              magnitudesDb: Float32Array.from([-120, -5]),
              sampleRate: audio.sampleRate,
            },
          };
        },
        destroy: () => {
          destroyed = true;
        },
      }),
    );

    await expect(
      controller.analyzeFrequency({ fftSize: 512, frameCount: 2 }),
    ).resolves.toMatchObject({
      spectrogram: { frameCount: 2 },
      spectrum: { sampleRate: 4 },
    });
    expect(receivedFrames).toBe(2);
    await controller.dispatch({ name: 'playback.seek', seconds: 0.5 });
    expect(controller.snapshot.audioRevision).toBe(1);
    await controller.close();
    expect(destroyed).toBe(true);
  });

  it('lazily analyzes rendered PCM and disposes the waveform worker port', async () => {
    const session = new EditorSession(new FakeEngine());
    await session.load(new ArrayBuffer(0), 'waveform.wav');
    let destroyed = false;
    let analyzedWidth = 0;
    const controller = new EditorController(
      session,
      new AudioExportService(),
      { save: () => undefined },
      () => ({ destroy: () => undefined, encode: async () => new ArrayBuffer(0) }),
      () => ({
        destroy: () => {
          destroyed = true;
        },
        extractAnalysis: async (audio, width) => {
          analyzedWidth = width;
          return {
            channels: audio.channels.map(() => ({
              length: 4,
              max: Float32Array.from([1]),
              min: Float32Array.from([-1]),
              samplesPerPixel: 4,
            })),
            overview: {
              length: 4,
              max: Float32Array.from([1]),
              min: Float32Array.from([-1]),
              samplesPerPixel: 4,
            },
          };
        },
      }),
    );

    await expect(controller.extractWaveform(320)).resolves.toMatchObject({
      channels: [{ length: 4 }],
      overview: { length: 4 },
    });
    expect(analyzedWidth).toBe(320);
    await controller.close();
    expect(destroyed).toBe(true);
  });

  it('exports session PCM through injected worker and download ports', async () => {
    const session = new EditorSession(new FakeEngine());
    await session.load(new ArrayBuffer(0), 'mix.mp3');
    const downloads: ExportedAudioFile[] = [];
    let destroyed = false;
    let depth: WavBitDepth | null = null;
    const controller = new EditorController(
      session,
      new AudioExportService(),
      { save: (file) => downloads.push(file) },
      () => ({
        destroy: () => {
          destroyed = true;
        },
        encode: async (_audio, bitDepth) => {
          depth = bitDepth;
          return Uint8Array.from([1, 2, 3]).buffer;
        },
      }),
    );

    await controller.downloadWav(24);

    expect(depth).toBe(24);
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toMatchObject({ fileName: 'mix.wav', mimeType: 'audio/wav' });
    expect(destroyed).toBe(true);
    await controller.close();
  });

  it('routes effect preview, cancellation, and apply through the native session', async () => {
    const engine = new FakeEngine();
    const session = new EditorSession(engine);
    const controller = new EditorController(session);
    await session.load(new ArrayBuffer(0), 'mix.mp3');
    await controller.dispatch({ name: 'selection.set', range: { end: 1, start: 0 } });

    expect(controller.supportedEffectIds).toHaveLength(8);
    expect(controller.supportsEffect('compressor')).toBe(true);
    expect(controller.supportsEffect('seamless-loop')).toBe(false);
    await controller.previewEffect('gain', { amount: 0 });
    expect(engine.toPcm().channels[0]?.every((sample) => sample === 0)).toBe(true);

    await controller.cancelEffectPreview();
    expect(Array.from(engine.toPcm().channels[0] ?? [])).toEqual([0, 1, 0, -1]);

    await controller.applyEffect('gain', { amount: 0.5 });
    expect(Array.from(engine.toPcm().channels[0] ?? [])).toEqual([0, 0.5, 0, -0.5]);
    await controller.close();
  });

  it('routes specialized workflows through typed session commands', async () => {
    const engine = new FakeEngine();
    const session = new EditorSession(engine);
    const controller = new EditorController(session);
    await session.load(new ArrayBuffer(0), 'automation.mp3');
    await controller.dispatch({ name: 'selection.set', range: { end: 1, start: 0 } });
    const workflow = {
      kind: 'automation' as const,
      points: [
        { timeSeconds: 0, value: 0 },
        { timeSeconds: 1, value: 1 },
      ],
      target: 'gain' as const,
    };

    expect(controller.supportedSpecializedEffectIds).toHaveLength(4);
    expect(controller.supportsSpecializedEffect('audio-repair')).toBe(true);
    await controller.previewSpecializedEffect(workflow);
    expect(Array.from(engine.toPcm().channels[0] ?? [])).toEqual([0, 0.25, 0, -0.75]);

    await controller.cancelEffectPreview();
    expect(Array.from(engine.toPcm().channels[0] ?? [])).toEqual([0, 1, 0, -1]);

    await controller.applySpecializedEffect(workflow);
    expect(Array.from(engine.toPcm().channels[0] ?? [])).toEqual([0, 0.25, 0, -0.75]);
    await controller.close();
  });
});
