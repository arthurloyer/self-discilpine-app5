const CACHE_NAME = 'sd-cache-v9';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); });
self.addEventListener('fetch', (e) => { const { request } = e; if (request.method !== 'GET') return;
  e.respondWith(caches.match(request).then(cached => cached || fetch(request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); return resp;
  }).catch(()=>cached)));
});
