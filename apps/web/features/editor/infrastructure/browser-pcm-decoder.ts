import type { PcmAudio } from '@audiomass/audio-engine';

export interface PcmDecoderPort {
  close(): Promise<void>;
  decode(data: ArrayBuffer): Promise<PcmAudio>;
}

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

/** Browser-only codec adapter used by the native multitrack controller. */
export class BrowserPcmDecoder implements PcmDecoderPort {
  private context: AudioContext | null = null;

  public async decode(data: ArrayBuffer): Promise<PcmAudio> {
    const buffer = await this.getContext().decodeAudioData(data.slice(0));
    return {
      channels: Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
        buffer.getChannelData(channel).slice(),
      ),
      sampleRate: buffer.sampleRate,
    };
  }

  public async close(): Promise<void> {
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') await context.close();
  }

  private getContext(): AudioContext {
    if (this.context) return this.context;
    const browser = globalThis as typeof globalThis & {
      AudioContext?: AudioContextConstructor;
      webkitAudioContext?: AudioContextConstructor;
    };
    const Context = browser.AudioContext ?? browser.webkitAudioContext;
    if (!Context) throw new Error('Web Audio API is unavailable in this browser.');
    this.context = new Context({ latencyHint: 'interactive' });
    return this.context;
  }
}
