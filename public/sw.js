const CACHE_NAME = 'third-eye-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API Requests: Network First
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Clone and cache the response
          const resClone = response.clone();
          caches.open(`${CACHE_NAME}-api`).then((cache) => cache.put(e.request, resClone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static Assets: Cache First, then Network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).then((response) => {
        // Cache new static assets
        if (response.status === 200 && (url.pathname.match(/\.(png|jpg|js|css|svg)$/) || url.hostname === location.hostname)) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return response;
      });
    })
  );
});
