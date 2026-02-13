// pwa-sw.js - Service Worker for FleetConnect PWA
// Handles caching, offline support, and push notifications

const CACHE_NAME = 'fleetconnect-v1';
const RUNTIME_CACHE = 'fleetconnect-runtime';
const API_CACHE = 'fleetconnect-api';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/login.html',
  '/index.html',
  '/vendor-dashboard.html',
  '/field-worker.html',
  '/chat.html',
  '/supabase-client.js',
  '/realtime.js',
  '/pwa-register.js',
  '/pwa-icons.js',
  '/chat-utils.js',
  '/demo-switcher.js',
  '/notifications.js',
  '/feature-flags.js',
  '/onboarding.js',
  '/offline-sync.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('https://cdn') && !url.startsWith('https://fonts')))
          .catch(err => console.warn('[SW] Some assets failed to cache:', err));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          }
          // If network fails, try cache
          return caches.match(event.request)
            .then((cached) => cached || createOfflineResponse('API unavailable'));
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cached) => cached || createOfflineResponse('Offline'));
        })
    );
    return;
  }

  // Supabase API - network first
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          }
          return caches.match(event.request);
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML pages - network first, fallback to cache
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          }
          return caches.match(event.request);
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cached) => cached || createOfflineResponse('Page unavailable offline'));
        })
    );
    return;
  }

  // Everything else (scripts, styles, images) - cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          })
          .catch(() => {
            // Return offline page/asset based on type
            if (event.request.destination === 'image') {
              return createOfflineImage();
            }
            return createOfflineResponse('Asset unavailable');
          });
      })
  );
});

// Create offline fallback responses
function createOfflineResponse(message) {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Offline</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #06060b; color: #f0f0f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .container { text-align: center; padding: 20px; }
          h1 { color: #60a5fa; margin-bottom: 10px; }
          p { color: #7a7a92; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You're Offline</h1>
          <p>${message}</p>
          <p style="font-size: 0.9em; margin-top: 20px;">FleetConnect is working to reconnect...</p>
        </div>
      </body>
    </html>
  `, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Offline-Page': 'true'
    }
  });
}

function createOfflineImage() {
  return new Response(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#1a1a1a"/>
      <text x="50" y="50" font-size="12" fill="#666" text-anchor="middle" dy=".3em">Image unavailable</text>
    </svg>
  `, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml'
    }
  });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  let notificationData = {
    title: 'FleetConnect',
    body: 'New update available',
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><rect width=%22192%22 height=%22192%22 rx=%2245%22 fill=%22%2360a5fa%22/><text x=%2296%22 y=%22135%22 font-size=%22120%22 font-weight=%22bold%22 fill=%22%230a0a0f%22 text-anchor=%22middle%22>F</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><circle cx=%2232%22 cy=%2232%22 r=%2232%22 fill=%22%2360a5fa%22/><text x=%2232%22 y=%2248%22 font-size=%2240%22 font-weight=%22bold%22 fill=%22white%22 text-anchor=%22middle%22>F</text></svg>',
    tag: 'fleetconnect',
    requireInteraction: true
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event - handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
});

console.log('[SW] Service worker script loaded');
