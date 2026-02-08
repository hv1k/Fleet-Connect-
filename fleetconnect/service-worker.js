// Service Worker for FleetConnect Field Worker App
// Enables offline functionality with background sync

const CACHE_NAME = 'fleetconnect-v1';
const urlsToCache = [
  '/',
  '/field-worker.html',
  '/supabase-client.js',
  '/feature-flags.js',
  '/offline-sync.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install: cache essential resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('[ServiceWorker] Some cache items failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Skip service worker itself
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Serve from cache when offline
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline placeholder if no cache
          if (request.destination === 'document') {
            return new Response(
              '<html><body style="font-family:sans-serif;padding:40px;background:#1a1a1a;color:#f5f0e8;">' +
              '<h1>Offline</h1><p>This page is not available offline. Please check your connection.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync: sync pending invoices when back online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-invoices') {
    event.waitUntil(
      (async () => {
        try {
          // Signal to main thread to sync pending invoices
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'BACKGROUND_SYNC',
              action: 'sync-invoices'
            });
          });
        } catch (err) {
          console.error('[ServiceWorker] Sync error:', err);
        }
      })()
    );
  }
});

// Message handling: receive messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
