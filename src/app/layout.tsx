import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#00f5ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'AURA — 3D Music Visualizer',
  description: 'Immersive 3D audio-reactive music visualizer with cinematic effects, galaxy simulations, and real-time beat detection.',
  keywords: ['music', 'visualizer', '3D', 'audio', 'reactive', 'WebGL', 'Three.js'],
  authors: [{ name: 'AURA' }],
  manifest: '/manifest.json',

  icons: {
    icon: [
      { url: '/icons/icon-16x16.png',   sizes: '16x16',   type: 'image/png' },
      { url: '/icons/icon-32x32.png',   sizes: '32x32',   type: 'image/png' },
      { url: '/icons/icon-48x48.png',   sizes: '48x48',   type: 'image/png' },
      { url: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png',      sizes: '180x180' },
      { url: '/icons/icon-152x152.png',    sizes: '152x152' },
      { url: '/icons/icon-167x167.png',    sizes: '167x167' },
      { url: '/icons/icon-120x120.png',    sizes: '120x120' },
      { url: '/icons/icon-76x76.png',      sizes: '76x76'   },
      { url: '/icons/icon-57x57.png',      sizes: '57x57'   },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/icon-192x192.png', color: '#00f5ff' },
    ],
  },

  openGraph: {
    title: 'AURA — 3D Music Visualizer',
    description: 'Immersive 3D audio-reactive visualizer with galaxy, black hole, neon tunnel, and 10 cinematic modes.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AURA Music Visualizer' }],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'AURA — 3D Music Visualizer',
    description: 'Immersive 3D audio-reactive visualizer',
    images: ['/og-image.png'],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AURA',
  },

  other: {
    'msapplication-TileColor': '#050510',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
