// ---------------------------------------------------------------------------
// Pépète v2.2 — Service Worker
// Strategies: Shell cache + Network First (API) + Stale While Revalidate (assets)
// ---------------------------------------------------------------------------

const CACHE_VERSION = 'v2.4.0';
const CACHE_NAME = `pepete-${CACHE_VERSION}`;
const SHELL_CACHE = `pepete-shell-${CACHE_VERSION}`;

const SHELL_FILES = [
  '/',
  '/index.html',
];

// ---------------------------------------------------------------------------
// Install: pre-cache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate: clean old caches & claim clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE_NAME && n !== SHELL_CACHE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch handler
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Skip cross-origin except Google Fonts
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) return;

  // API calls → network only, offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Vous etes hors ligne. Reconnectez-vous pour continuer.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Navigation requests → network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match(request))
    );
    return;
  }

  // Static assets → stale while revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = { title: 'Pepete', body: 'Nouveau message', url: '/' };
  try {
    data = event.data?.json() || data;
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/icon.png',
      badge: '/assets/favicon.png',
      vibrate: [200, 100, 200],
      tag: 'pepete-message',
      renotify: true,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('pepete') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
