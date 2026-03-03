// ---------------------------------------------------------------------------
// Patoune v2.0 — Service Worker
// Strategy: Cache Shell (app shell) + Network First (API calls)
// ---------------------------------------------------------------------------

const CACHE_NAME = 'patoune-v2.1.0';
const SHELL_CACHE = 'patoune-shell-v2.1.0';

// App shell files to pre-cache
const SHELL_FILES = [
  '/',
  '/index.html',
];

// ---------------------------------------------------------------------------
// Install: pre-cache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching shell');
        return cache.addAll(SHELL_FILES);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.log('[SW] Pre-cache failed (non-critical):', err);
        return self.skipWaiting();
      })
  );
});

// ---------------------------------------------------------------------------
// Activate: clean old caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== SHELL_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
      .then(() => {
        // Notify all clients to reload when new SW activates
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        });
      })
  );
});

// ---------------------------------------------------------------------------
// Fetch: Network first for API, cache first for static
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except Google Fonts)
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  // API calls: network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Vous etes hors ligne' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('Offline', { status: 503 }));

      return cachedResponse || fetchPromise;
    })
  );
});
