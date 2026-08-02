import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#050607',
    description: 'Browser-first multitrack audio editor and waveform workstation.',
    display: 'standalone',
    icons: [
      {
        purpose: 'any',
        sizes: 'any',
        src: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        purpose: 'maskable',
        sizes: 'any',
        src: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    name: 'AudioMass',
    short_name: 'AudioMass',
    start_url: '/editor',
    theme_color: '#050607',
  };
}
