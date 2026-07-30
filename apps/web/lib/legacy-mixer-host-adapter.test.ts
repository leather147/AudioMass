import { describe, expect, it } from 'vitest';

import { LegacyMixerHostAdapter } from '@/components/tools/legacy-mixer-host-adapter';

describe('legacy mixer host boundary', () => {
  it('isolates the temporary global mixer contract behind one adapter', () => {
    const writes: unknown[][] = [];
    const data = {
      master: { meter: 0, vol: 1 },
      on: true,
      tracks: [],
    };
    const adapter = new LegacyMixerHostAdapter({
      PKAudioEditor: {
        multitrack: {
          MixerData: () => data,
          MixerSet: (...values: unknown[]) => {
            writes.push(values);
            return true;
          },
        },
      },
    } as never);

    expect(adapter.read()).toBe(data);
    adapter.set('track', 'vol', 0.5, 1);
    expect(writes).toEqual([['track', 'vol', 0.5, 1]]);
  });
});
