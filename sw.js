const CACHE_NAME = 'apoio-2026-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    // Adicione suas imagens de moldura aqui depois para cachear também
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});