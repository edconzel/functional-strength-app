// Offline support.
//
// App files are fetched from the network first, so a new version shows up as
// soon as it is published, and fall back to the saved copy when there is no
// connection or the connection is too slow. Nothing here needs a version bump
// when the app changes. Add new files to CORE so they are saved on install;
// anything else is saved the first time it is loaded.
const CACHE = 'functional-strength-v1';
const NETWORK_TIMEOUT_MS = 3000;

const CORE = [
    './',
    './index.html',
    './style.css',
    './manifest.webmanifest',
    './js/app.js',
    './js/audio.js',
    './js/data.js',
    './js/interval-timer.js',
    './js/stopwatch.js',
    './assets/app-icon-192.png',
    './assets/app-icon-512.png',
    './assets/fascia_hopping_icon.png',
    './assets/foam_roller_icon.png',
    './assets/horse_stance_icon.svg',
    './assets/indian_clubs_icon.png',
    './assets/jump_rope_icon.png',
    './assets/kettlebell_icon.png',
    './assets/paleo_squats_icon.png',
    './assets/plank_icon.png',
    './assets/slow_jogging_icon.svg',
    './assets/somersaults_icon.png',
    './assets/vibe_plate_icon.png',
    './assets/yoga_icon.png'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            // One missing file must not stop the rest from being saved.
            .then((cache) => Promise.allSettled(
                CORE.map((url) => cache.add(new Request(url, { cache: 'reload' })))
            ))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

const save = async (request, response) => {
    if (!response || !(response.ok || response.type === 'opaque')) return;
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
};

const networkFirst = async (request) => {
    const cached = await caches.match(request, { ignoreSearch: true });
    const fromNetwork = fetch(request, { cache: 'no-cache' }).then((response) => {
        save(request, response.clone()).catch(() => {});
        return response;
    });

    if (!cached) return fromNetwork;
    // If the saved copy is served first, a later network failure is expected.
    fromNetwork.catch(() => {});

    // With a saved copy on hand, don't make a weak signal hold up the page.
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
    try {
        const response = await Promise.race([fromNetwork, timeout]);
        if (response && response.ok) return response;
        return cached;
    } catch (e) {
        return cached;
    }
};

const cacheFirst = async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    save(request, response.clone()).catch(() => {});
    return response;
};

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    if (url.origin === self.location.origin) {
        event.respondWith(networkFirst(request));
    } else if (FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(request));
    }
});
