import type { CSSProperties } from 'react';

import type { EditorTheme } from '@/lib/editor-preferences';

export interface EditorThemeDefinition {
  accent: string;
  accentAlt: string;
  background: string;
  border: string;
  danger: string;
  id: EditorTheme;
  mode: 'dark' | 'light';
  panel: string;
  surface: string;
  text: string;
  textMuted: string;
}

const EDITOR_THEME_DEFINITIONS: Record<EditorTheme, EditorThemeDefinition> = {
  replicate: {
    accent: '#43e4dc',
    accentAlt: '#8ef1ec',
    background: '#050607',
    border: '#252b33',
    danger: '#ff4d5e',
    id: 'replicate',
    mode: 'dark',
    panel: '#0c0f12',
    surface: '#12171d',
    text: '#f6f7f8',
    textMuted: '#b2bcc8',
  },
  dracula: {
    accent: '#bd93f9',
    accentAlt: '#ff79c6',
    background: '#191a21',
    border: '#44475a',
    danger: '#ff5555',
    id: 'dracula',
    mode: 'dark',
    panel: '#282a36',
    surface: '#343746',
    text: '#f8f8f2',
    textMuted: '#c6c8d1',
  },
  nord: {
    accent: '#88c0d0',
    accentAlt: '#8fbcbb',
    background: '#242933',
    border: '#4c566a',
    danger: '#bf616a',
    id: 'nord',
    mode: 'dark',
    panel: '#2e3440',
    surface: '#3b4252',
    text: '#eceff4',
    textMuted: '#d8dee9',
  },
  'tokyo-night': {
    accent: '#7aa2f7',
    accentAlt: '#2ac3de',
    background: '#16161e',
    border: '#3b4261',
    danger: '#f7768e',
    id: 'tokyo-night',
    mode: 'dark',
    panel: '#1a1b26',
    surface: '#292e42',
    text: '#c0caf5',
    textMuted: '#a9b1d6',
  },
  catppuccin: {
    accent: '#cba6f7',
    accentAlt: '#89b4fa',
    background: '#11111b',
    border: '#45475a',
    danger: '#f38ba8',
    id: 'catppuccin',
    mode: 'dark',
    panel: '#181825',
    surface: '#313244',
    text: '#cdd6f4',
    textMuted: '#bac2de',
  },
  'one-dark': {
    accent: '#61afef',
    accentAlt: '#56b6c2',
    background: '#17191f',
    border: '#3e4451',
    danger: '#e06c75',
    id: 'one-dark',
    mode: 'dark',
    panel: '#1e2127',
    surface: '#323842',
    text: '#abb2bf',
    textMuted: '#9da5b4',
  },
  gruvbox: {
    accent: '#fabd2f',
    accentAlt: '#83a598',
    background: '#1d2021',
    border: '#504945',
    danger: '#fb4934',
    id: 'gruvbox',
    mode: 'dark',
    panel: '#282828',
    surface: '#3c3836',
    text: '#ebdbb2',
    textMuted: '#d5c4a1',
  },
  'solarized-dark': {
    accent: '#2aa198',
    accentAlt: '#268bd2',
    background: '#002b36',
    border: '#285a63',
    danger: '#dc322f',
    id: 'solarized-dark',
    mode: 'dark',
    panel: '#073642',
    surface: '#174b55',
    text: '#eee8d5',
    textMuted: '#93a1a1',
  },
  'github-light': {
    accent: '#0969da',
    accentAlt: '#0550ae',
    background: '#f6f8fa',
    border: '#d0d7de',
    danger: '#cf222e',
    id: 'github-light',
    mode: 'light',
    panel: '#ffffff',
    surface: '#eaeef2',
    text: '#1f2328',
    textMuted: '#57606a',
  },
  'solarized-light': {
    accent: '#268bd2',
    accentAlt: '#2aa198',
    background: '#fdf6e3',
    border: '#c9c2ad',
    danger: '#dc322f',
    id: 'solarized-light',
    mode: 'light',
    panel: '#eee8d5',
    surface: '#ddd6c0',
    text: '#073642',
    textMuted: '#586e75',
  },
};

export function getEditorTheme(theme: EditorTheme): EditorThemeDefinition {
  return EDITOR_THEME_DEFINITIONS[theme];
}

export function editorThemeStyle(themeId: EditorTheme): CSSProperties {
  const theme = getEditorTheme(themeId);
  return {
    colorScheme: theme.mode,
    '--editor-accent': theme.accent,
    '--editor-accent-alt': theme.accentAlt,
    '--editor-bg': theme.background,
    '--editor-border': theme.border,
    '--editor-danger': theme.danger,
    '--editor-panel': theme.panel,
    '--editor-surface': theme.surface,
    '--editor-text': theme.text,
    '--editor-text-muted': theme.textMuted,
  } as CSSProperties;
}
