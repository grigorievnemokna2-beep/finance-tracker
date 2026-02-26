const CACHE_NAME = 'finance-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/store.js',
    './js/utils.js',
    './js/app.js',
    './js/dashboard.js',
    './js/transactions.js',
    './js/statistics.js',
    './js/budget.js',
    './js/savings.js',
    './js/settings.js',
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg'
];

// Install — cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — cache first, then network
self.addEventListener('fetch', (event) => {
    // Skip CDN requests (Chart.js) — always fetch from network
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            });
        })
    );
});
