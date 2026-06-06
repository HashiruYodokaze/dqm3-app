const CACHE_NAME = 'dqm3-tracker-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/data/monsters.json',
    '/data/synthesis.json',
    '/data/location.json',
    '/data/season.json',
    '/data/weather.json',
    '/data/monster_egg_type.json',
    '/data/egg_type.json',
    '/data/monster_location.json',
    '/data/family.json',
    '/data/rank.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
