import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { readEditorPreferences } from '@/lib/editor-preference-cookies';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'AudioMass', template: '%s · AudioMass' },
  description: 'Browser-first multitrack audio editor and waveform workstation.',
  applicationName: 'AudioMass',
};

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#050607',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const preferences = await readEditorPreferences();
  return (
    <html lang={preferences.locale}>
      <body>{children}</body>
    </html>
  );
}
