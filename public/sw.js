const CACHE_NAME = 'video-audio-web-ffmpeg-v1';
const CORE_PATHS = [
  './ffmpeg-core/ffmpeg-core.js',
  './ffmpeg-core/ffmpeg-core.wasm',
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('video-audio-web-ffmpeg-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isCore = CORE_PATHS.some((path) => url.pathname.endsWith(path.replace('./', '/')));
  if (!isCore) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const fallback = await cache.match(request);
      if (fallback) return fallback;
      throw error;
    }
  })());
});
