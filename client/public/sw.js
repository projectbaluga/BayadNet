const CACHE_NAME = 'subscriber-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Try to fetch with no-cache to ensure we don't cache stale content during install
        return Promise.all(
          urlsToCache.map(url => {
            return fetch(url, { cache: 'no-store' })
              .then(response => {
                if (response.ok) return cache.put(url, response);
                return cache.add(url);
              })
              .catch(() => cache.add(url));
          })
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Strategy: Network First for navigation requests (HTML)
  // We use cache: 'no-store' to bypass any browser/proxy cache when network is available
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
          return caches.match(event.request) || caches.match('/index.html');
        })
    );
    return;
  }

  // Strategy: Cache First for other assets, falling back to network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
