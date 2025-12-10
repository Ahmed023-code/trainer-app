// Service Worker for Trainer App
// Provides offline caching for static assets and dynamic GIF caching

const CACHE_VERSION = "v1";
const STATIC_CACHE = `trainer-static-${CACHE_VERSION}`;
const DATA_CACHE = `trainer-data-${CACHE_VERSION}`;
const GIF_CACHE = `trainer-gifs-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/data/exercisedb-exercises.json",
  "/data/bodyparts.json",
  "/data/equipments.json",
  "/data/muscles.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName.startsWith("trainer-") &&
            cacheName !== STATIC_CACHE &&
            cacheName !== DATA_CACHE &&
            cacheName !== GIF_CACHE
          ) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle GIF requests with cache-first strategy
  if (url.pathname.endsWith(".gif")) {
    event.respondWith(
      caches.open(GIF_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving cached GIF:", url.pathname);
            return cachedResponse;
          }

          // Not in cache, fetch from network and cache
          return fetch(request)
            .then((networkResponse) => {
              // Only cache successful responses
              if (networkResponse.ok) {
                console.log("[SW] Caching new GIF:", url.pathname);
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((error) => {
              console.error("[SW] Failed to fetch GIF:", url.pathname, error);
              throw error;
            });
        });
      })
    );
    return;
  }

  // Handle data JSON files with cache-first, update in background
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });

          // Return cached response immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
    );
    return;
  }

  // For everything else, network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
