/* RetroCam offline cache. Bump CACHE when you deploy a change that must
   replace what's already cached on someone's phone. */
const CACHE = 'retrocam-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => Promise.all(CORE.map(u => cache.add(u).catch(() => {}))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

/* Cache-first, refreshed in the background when online (stale-while-revalidate).
   This covers index.html, the icons, lut.cube, and the Google Fonts files the
   page loads, so once everything has been fetched once, the app opens and runs
   with no network at all. */
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    const network = fetch(event.request).then(res => {
      if(res && (res.ok || res.type === 'opaque')) cache.put(event.request, res.clone());
      return res;
    }).catch(() => null);
    if(cached){ network; return cached; }
    return (await network) || cached || Response.error();
  })());
});
