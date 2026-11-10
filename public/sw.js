// Location: public/sw.js
// Service Worker (Handles registration and silences localhost 404 warnings)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle all requests normally
  return;
});