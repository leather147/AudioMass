import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
