/* eslint-disable no-restricted-globals */
// Petmate offline cache.
//
// On install, everything the app needs is cached: the files listed in the
// build's asset-manifest.json plus the bundled charsets and PWA icons.
//
// The page itself is fetched network-first (falling back to the cache when
// offline), so a new deploy is picked up on the next launch with a
// connection.  Everything else is cache-first: build outputs have
// content hashes in their names, so they never change under the same URL.

const CACHE = 'petmate-v1';

const STATIC_FILES = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'assets/system-charset.bin',
  'assets/system-charset-lower.bin',
  'assets/pet-charset-upper.bin',
  'assets/pet-charset-lower.bin',
  'assets/template.prg'
];

function buildFiles() {
  return fetch('asset-manifest.json', { cache: 'no-store' })
    .then(res => res.json())
    .then(manifest => Object.values(manifest.files)
      .filter(f => typeof f === 'string' && !f.endsWith('.map') && !f.endsWith('index.html') &&
        // create-react-app's own (unused) service worker
        !f.includes('service-worker.js') && !f.includes('precache-manifest'))
      // asset-manifest paths are relative to the build root ("./static/..").
      .map(f => f.replace(/^\.\//, '')));
}

self.addEventListener('install', event => {
  event.waitUntil(
    buildFiles()
      .then(files => caches.open(CACHE).then(cache => cache.addAll(STATIC_FILES.concat(files))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(request) {
  return fetch(request)
    .then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        // A new page may reference new build files, cache them for offline.
        buildFiles()
          .then(files => caches.open(CACHE).then(cache =>
            Promise.all(files.map(f => cache.match(f).then(hit => hit || cache.add(f))))))
          .catch(() => {});
      }
      return res;
    })
    .catch(() => caches.match(request).then(res => res || caches.match('index.html')));
}

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) {
      return cached;
    }
    return fetch(request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return res;
    });
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
