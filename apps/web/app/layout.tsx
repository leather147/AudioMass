import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { readEditorPreferences } from '@/lib/editor-preference-cookies';
import { editorThemeStyle, getEditorTheme } from '@/features/editor/theme/editor-themes';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'AudioMass', template: '%s · AudioMass' },
  description: 'Browser-first multitrack audio editor and waveform workstation.',
  applicationName: 'AudioMass',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#050607',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const preferences = await readEditorPreferences();
  const theme = getEditorTheme(preferences.theme);
  return (
    <html
      data-theme={preferences.theme}
      data-theme-mode={theme.mode}
      lang={preferences.locale}
      style={editorThemeStyle(preferences.theme)}
    >
      <body>{children}</body>
    </html>
  );
}
