import { describe, expect, it } from 'vitest';

import { PluginError } from '@plugin-sdk/errors';
import { validatePluginManifest } from '@plugin-sdk/manifest';

describe('validatePluginManifest', () => {
  it('normalizes a compatible manifest', () => {
    expect(
      validatePluginManifest({
        apiVersion: '1',
        id: 'studio.audiomass.normalize',
        name: ' Normalize ',
        permissions: { required: ['audio:write'] },
        version: '1.2.0',
      }),
    ).toMatchObject({
      apiVersion: '1',
      id: 'studio.audiomass.normalize',
      name: 'Normalize',
      version: '1.2.0',
    });
  });

  it.each([
    { apiVersion: '2', id: 'studio.valid', name: 'Plugin', version: '1.0.0' },
    { apiVersion: '1', id: 'invalid', name: 'Plugin', version: '1.0.0' },
    { apiVersion: '1', id: 'studio.valid', name: 'Plugin', version: 'latest' },
  ])('rejects incompatible metadata', (manifest) => {
    expect(() => validatePluginManifest(manifest)).toThrow(PluginError);
  });
});
