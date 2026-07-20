import { describe, expect, it } from 'vitest';

import { DEFAULT_EDITOR_PREFERENCES, parseEditorPreferences } from '@/lib/editor-preferences';

describe('parseEditorPreferences', () => {
  it('accepts supported locale and theme values', () => {
    expect(parseEditorPreferences({ locale: 'en', theme: 'nord' })).toEqual({
      locale: 'en',
      theme: 'nord',
    });
  });

  it('falls back for untrusted values', () => {
    expect(parseEditorPreferences({ locale: 'de', theme: '<script>' })).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });
});
