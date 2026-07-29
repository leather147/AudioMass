import { describe, expect, it } from 'vitest';

import {
  LegacyEditorVendorGateway,
  type VendorScriptLoader,
} from '@/features/editor/infrastructure/legacy-editor-vendor-gateway';
import {
  EDITOR_VENDOR_ASSETS,
  EDITOR_VENDOR_ASSET_LIST,
} from '@/features/editor/infrastructure/vendor-assets';

class FakeScriptLoader implements VendorScriptLoader {
  public readonly loaded: string[] = [];

  public async load(path: string): Promise<void> {
    this.loaded.push(path);
  }
}

describe('legacy editor vendor gateway', () => {
  it('keeps the eight allowlisted assets behind absolute editor paths', () => {
    expect(EDITOR_VENDOR_ASSET_LIST).toHaveLength(8);
    expect(new Set(EDITOR_VENDOR_ASSET_LIST.map((asset) => asset.id)).size).toBe(8);
    for (const asset of EDITOR_VENDOR_ASSET_LIST) {
      expect(asset.path).toMatch(/^\/editor-assets\//);
      expect(asset.path).not.toMatch(/\.\.\/|\.html(?:$|\?)/);
    }
  });

  it('loads and validates WaveSurfer and its regions plugin in order', async () => {
    const scripts = new FakeScriptLoader();
    const wave = { id: 'wave' };
    const plugin = { id: 'regions' };
    const gateway = new LegacyEditorVendorGateway(scripts, {
      WaveSurfer: {
        create: () => wave,
        regions: { create: () => plugin },
      },
    });

    const runtime = await gateway.loadWaveSurfer();
    expect(scripts.loaded).toEqual([
      EDITOR_VENDOR_ASSETS.waveformCore.path,
      EDITOR_VENDOR_ASSETS.waveformRegions.path,
    ]);
    expect(runtime.create({})).toBe(wave);
    expect(runtime.regions.create({})).toBe(plugin);
  });

  it('validates LZ4 data at the adapter boundary', async () => {
    const scripts = new FakeScriptLoader();
    const encoded = Uint8Array.from([1, 2]);
    const decoded = Uint8Array.from([3, 4]);
    const gateway = new LegacyEditorVendorGateway(scripts, {
      lz4BlockCodec: {
        createInstance: async () => ({
          decodeBlock: () => decoded,
          encodeBlock: () => encoded,
        }),
      },
    });

    const codec = await gateway.loadCompressionCodec();
    expect(codec.encodeBlock(new ArrayBuffer(0), 0)).toBe(encoded);
    expect(codec.decodeBlock(encoded, 0, 2)).toBe(decoded);
    expect(scripts.loaded).toEqual([EDITOR_VENDOR_ASSETS.lz4Dispatcher.path]);
  });

  it('creates classic codec workers only through injected factories', () => {
    const calls: Array<{ options: WorkerOptions; url: string }> = [];
    const worker = new EventTarget();
    const gateway = new LegacyEditorVendorGateway(new FakeScriptLoader(), {}, (url, options) => {
      calls.push({ options, url });
      return worker as unknown as Worker;
    });

    expect(gateway.createMp3EncoderWorker()).toBe(worker);
    expect(gateway.createFlacEncoderWorker()).toBe(worker);
    expect(calls).toEqual([
      {
        options: { name: 'audiomass-mp3-encoder', type: 'classic' },
        url: EDITOR_VENDOR_ASSETS.mp3Encoder.path,
      },
      {
        options: { name: 'audiomass-flac-encoder', type: 'classic' },
        url: EDITOR_VENDOR_ASSETS.flacEncoder.path,
      },
    ]);
  });

  it('fails closed when a vendor global does not match its contract', async () => {
    const gateway = new LegacyEditorVendorGateway(new FakeScriptLoader(), { WaveSurfer: {} });
    await expect(gateway.loadWaveSurfer()).rejects.toThrow('regions');
  });
});
