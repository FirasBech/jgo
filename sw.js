/* J.GO — service worker (offline app shell).
   Caches only the static front-end. The bridge (localhost:8787) and the public
   job APIs are a different origin and are always passed through to the network. */
const CACHE = 'career-dash-v1';
const ASSETS = ['.', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only manage same-origin GET requests for the shell; everything else (POSTs,
  // cross-origin) goes straight to the network untouched.
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Never cache the bridge's live API — even when it's served from the same origin.
  if (/^\/(jobs|ai|health|backup)\b/.test(url.pathname)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match('index.html')))
  );
});
