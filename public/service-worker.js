const cacheName = 'podcast-player-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/default-podcast.png',
  '/favicon.png',
  '/podcast-icon-512.png',
  '/podcast-icon-192.png',
  '/podcast-icon-144.png',
  '/podcast-icon-168.png',
  '/podcast-icon-96.png',
  '/podcast-icon-72.png',
  '/podcast-icon-48.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {})
  );
});

// self.addEventListener('fetch', (e) => {
//   e.respondWith(
//     (async () => {
//       const r = await caches.match(e.request);
//       console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
//       if (r) {
//         return r;
//       }
//       const response = await fetch(e.request);
//       const cache = await caches.open(cacheName);
//       console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
//       cache.put(e.request, response.clone());
//       return response;
//     })()
//   );
// });

self.addEventListener('activate', (event) => {
  const cacheWhiteList = [cacheName];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!cacheWhiteList.includes(cache)) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
