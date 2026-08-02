import { describe, expect, it } from 'vitest';

import {
  DEFAULT_EDITOR_PREFERENCES,
  isEditorPreferences,
  parseEditorPreferences,
} from '@/lib/editor-preferences';
import { editorCopy } from '@/lib/editor-copy';

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

  it('validates complete bridge payloads', () => {
    expect(isEditorPreferences({ locale: 'en', theme: 'dracula' })).toBe(true);
    expect(isEditorPreferences({ locale: 'de', theme: 'dracula' })).toBe(false);
    expect(isEditorPreferences({ locale: 'en' })).toBe(false);
  });

  it('localizes production navigation, state, and fallback accessibility copy', () => {
    expect(editorCopy('en', 'settingsMenu')).toBe('Settings');
    expect(editorCopy('ru', 'settingsMenu')).toBe('Настройки');
    expect(editorCopy('en', 'engineStatePlaying')).toBe('Playing');
    expect(editorCopy('ru', 'analysisFailed')).toBe('Не удалось выполнить анализ аудио.');
    expect(editorCopy('ru', 'dismiss')).toBe('Закрыть');
  });
});
