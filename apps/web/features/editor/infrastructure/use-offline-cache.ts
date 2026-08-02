'use client';

import { useEffect } from 'react';

const OFFLINE_ROUTES = ['/editor', '/settings', '/about', '/manifest.webmanifest', '/icon.svg'];
const CACHE_CONFIRMATION = 'CACHE_URLS_COMPLETE';

export function collectOfflineUrls(entries: readonly PerformanceEntry[], origin: string): string[] {
  const urls = new Set(OFFLINE_ROUTES.map((path) => new URL(path, origin).href));
  for (const entry of entries) {
    try {
      const url = new URL(entry.name, origin);
      if (url.origin === origin && !url.pathname.startsWith('/api/')) urls.add(url.href);
    } catch {
      // Ignore malformed performance entries supplied by browser extensions.
    }
  }
  return [...urls];
}

export function useOfflineCache(): void {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let active = true;

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (registration) => {
        await navigator.serviceWorker.ready;
        if (!active) return;
        const worker = navigator.serviceWorker.controller ?? registration.active;
        if (!worker) return;
        const channel = new MessageChannel();
        const completion = new Promise<void>((resolve) => {
          let settled = false;
          let timeout = 0;
          const finish = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            channel.port1.close();
            resolve();
          };
          timeout = window.setTimeout(finish, 10_000);
          channel.port1.onmessage = (event) => {
            if (event.data?.type !== CACHE_CONFIRMATION) return;
            finish();
          };
        });
        worker.postMessage(
          {
            type: 'CACHE_URLS',
            urls: collectOfflineUrls(performance.getEntriesByType('resource'), location.origin),
          },
          [channel.port2],
        );
        await completion;
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);
}
