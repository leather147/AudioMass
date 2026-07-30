export interface LegacyMixerTrack {
  id: string;
  meter: number;
  mute: boolean;
  name: string;
  pan: number;
  rec: boolean;
  sel: boolean;
  solo: boolean;
  vol: number;
}

export interface LegacyMixerData {
  master: { meter: number; vol: number };
  on: boolean;
  tracks: LegacyMixerTrack[];
}

interface LegacyMixerWindow extends Window {
  PKAudioEditor?: {
    multitrack?: {
      MixerData(): LegacyMixerData;
      MixerSet(id: string, key: string, value: boolean | number | string, done: number): boolean;
    };
  };
}

/**
 * Temporary same-origin adapter for the behavior-complete `/editor` fallback.
 * The framework-native editor does not import this module; Wave F deletes it
 * together with the remaining compatibility runtime.
 */
export class LegacyMixerHostAdapter {
  public constructor(private readonly host: LegacyMixerWindow | null) {}

  public read(): LegacyMixerData | null {
    const data = this.host?.PKAudioEditor?.multitrack?.MixerData();
    return data?.on ? data : null;
  }

  public set(id: string, key: string, value: boolean | number, done: number): void {
    this.host?.PKAudioEditor?.multitrack?.MixerSet(id, key, value, done);
  }
}

export function legacyMixerHost(embedded: boolean): LegacyMixerHostAdapter {
  try {
    return new LegacyMixerHostAdapter(
      (embedded ? window.parent : window.opener) as LegacyMixerWindow | null,
    );
  } catch {
    return new LegacyMixerHostAdapter(null);
  }
}
