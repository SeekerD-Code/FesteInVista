<<<<<<< HEAD
const CACHE_NAME = 'festeinvista-v1';
const ASSETS = [
    './',
    './index.html',
    './elenco.html',
    './calendario.html',
    './contatti.html',
    './dati-evento.html',
    './mappa-preferiti.html',
    './preferiti.html',
    './manifest.json',
    './favicon.ico',
    './italy_regions.geojson',
    './css/style.css',
    './css/style-menu.css',
    './css/style-pc.css',
    './css/Style-SplashScreen.css',
    './js/animazione_pin.js',
    './js/app.js',
    './js/calendario.js',
    './js/data-fetcher.js',
    './js/filters-utils.js',
    './js/header-component.js',
    './js/index.js',
    './js/map-preferiti.js',
    './js/map.js',
    './js/preferiti-handler.js',
    './js/preferiti.js',
    './js/ui-components.js',
    './images/food.webp',
    './images/folk.webp',
    './images/comics.webp',
    './images/funny.webp',
    './images/Italia.webp',
    './images/logo FV.png'
];


// Installazione e cache delle risorse
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Forza l'attivazione immediata del nuovo SW
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Attivazione e pulizia vecchie cache
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Recupero risorse (offline-first)
self.addEventListener('fetch', (e) => {
    // ⚠️ Ignora la chiamata specifica a Google Apps Script
    if (e.request.url === "https://script.google.com/macros/s/AKfycbz42rluHPkQlJ-oVyBqxkp_IV8Evg21oZhk_NpS9-qCV2gx6xjpbYImJvO8Y3KxiUppwg/exec") {
        return; // Lascia gestire la richiesta direttamente alla rete
    }
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
=======
const CACHE_NAME = 'festeinvista-v1';
const ASSETS = [
    './',
    './index.html',
    './elenco.html',
    './calendario.html',
    './contatti.html',
    './dati-evento.html',
    './mappa-preferiti.html',
    './preferiti.html',
    './manifest.json',
    './favicon.ico',
    './italy_regions.geojson',
    './css/style.css',
    './css/style-menu.css',
    './css/style-pc.css',
    './css/Style-SplashScreen.css',
    './js/animazione_pin.js',
    './js/app.js',
    './js/calendario.js',
    './js/data-fetcher.js',
    './js/filters-utils.js',
    './js/header-component.js',
    './js/index.js',
    './js/map-preferiti.js',
    './js/map.js',
    './js/preferiti-handler.js',
    './js/preferiti.js',
    './js/ui-components.js',
    './images/food.webp',
    './images/folk.webp',
    './images/comics.webp',
    './images/funny.webp',
    './images/Italia.webp',
    './images/logo FV.png'
];


// Installazione e cache delle risorse
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Forza l'attivazione immediata del nuovo SW
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Attivazione e pulizia vecchie cache
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Recupero risorse (offline-first)
self.addEventListener('fetch', (e) => {
    // ⚠️ Ignora la chiamata specifica a Google Apps Script
    if (e.request.url === "https://script.google.com/macros/s/AKfycbz42rluHPkQlJ-oVyBqxkp_IV8Evg21oZhk_NpS9-qCV2gx6xjpbYImJvO8Y3KxiUppwg/exec") {
        return; // Lascia gestire la richiesta direttamente alla rete
    }
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
>>>>>>> 8bbd9702ae28e15a16ac13826b8e677621eafe79
});