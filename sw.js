const CACHE_VERSION = 'nexus-cache-v1';
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    // External Fonts and Icons used in the Terminal
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap'
];

// --- INSTALL EVENT ---
// Pre-cache core structural assets so the terminal shell loads offline.
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            console.log('[Nexus SW] Pre-caching core assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

// --- ACTIVATE EVENT ---
// Clean up old cache versions to ensure users aren't stuck on legacy terminal logic.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_VERSION) {
                        console.log(`[Nexus SW] Terminating legacy cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// --- FETCH EVENT: STALE-WHILE-REVALIDATE ---
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests like Firebase auth/firestore or Google Ads
    // We only want to intercept static assets and our own origin
    if (!event.request.url.startsWith(self.location.origin) && 
        !PRECACHE_ASSETS.includes(event.request.url)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // The network fetch runs in the background to update the cache
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Ensure the response is valid before caching
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch((err) => {
                console.warn('[Nexus SW] Network fetch failed, relying entirely on cache.', err);
            });

            // Return the cached response immediately if it exists, otherwise wait for the network
            return cachedResponse || fetchPromise;
        })
    );
});
