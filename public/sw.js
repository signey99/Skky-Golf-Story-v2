const CACHE_NAME = 'skky-golf-v12';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png?v=12',
  '/icon-512.png?v=12',
  '/apple-touch-icon.png?v=12',
  '/golf_couple.png?v=12'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // For app assets or dynamic chunks, try network first, falling back to cache
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid response, clone it and put in cache dynamically
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline or network failure: load from cache
        return caches.match(e.request, { ignoreSearch: true });
      })
  );
});
