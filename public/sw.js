// public/sw.js
self.addEventListener("install", (event) => {
  console.log("Service Worker de FinWise instalado.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker de FinWise activado.");
});

// Intercepta las peticiones de red (necesario para la PWA)
self.addEventListener("fetch", (event) => {
  // Por ahora, solo deja pasar las peticiones normalmente
  event.respondWith(fetch(event.request));
});
