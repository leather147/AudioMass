export const EDITOR_THEMES = [
  { id: 'replicate', name: 'Replicate' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'nord', name: 'Nord' },
  { id: 'tokyo-night', name: 'Tokyo Night' },
  { id: 'catppuccin', name: 'Catppuccin Mocha' },
  { id: 'one-dark', name: 'One Dark' },
  { id: 'gruvbox', name: 'Gruvbox Dark' },
  { id: 'solarized-dark', name: 'Solarized Dark' },
  { id: 'github-light', name: 'GitHub Light' },
  { id: 'solarized-light', name: 'Solarized Light' },
] as const;

export const EDITOR_LOCALES = [
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'English' },
] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number]['id'];
export type EditorLocale = (typeof EDITOR_LOCALES)[number]['id'];

export interface EditorPreferences {
  locale: EditorLocale;
  theme: EditorTheme;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  locale: 'ru',
  theme: 'replicate',
};

function isTheme(value: unknown): value is EditorTheme {
  return EDITOR_THEMES.some((theme) => theme.id === value);
}

function isLocale(value: unknown): value is EditorLocale {
  return EDITOR_LOCALES.some((locale) => locale.id === value);
}

export function parseEditorPreferences(value: {
  locale?: unknown;
  theme?: unknown;
}): EditorPreferences {
  return {
    locale: isLocale(value.locale) ? value.locale : DEFAULT_EDITOR_PREFERENCES.locale,
    theme: isTheme(value.theme) ? value.theme : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}
