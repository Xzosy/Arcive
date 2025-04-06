// sw.js

const CACHE_NAME = 'galeri-angkasa-cache-v1'; // Nama cache (ubah jika ada update besar)
const urlsToCache = [
  '/', // Halaman utama (index.html)
  '/index.html', // Eksplisitkan juga jika perlu
  '/style.css', // File CSS Anda
  '/script.js', // File JavaScript Anda
  '/manifest.json', // File manifest
  '/images/icon-192x192.png', // Ikon yang penting
  '/images/icon-512x512.png', // Ikon yang penting
  '/images/stars_background.png' // Gambar background bintang jika penting untuk offline
  // Tambahkan path ke gambar planet atau carousel JIKA Anda ingin mereka cached awal
  // '/images/planets/planet-dist1.png',
  // '/images/carousel/foto1.jpg',
  // '/audio/background_music.mp3' // Hati-hati cache file besar seperti audio/video
];

// 1. Install Service Worker & Cache Assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Aktifkan SW baru segera
      })
      .catch(error => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
});

// 2. Activate Service Worker & Clean Up Old Caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Hapus cache lama jika namanya berbeda
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Ambil alih kontrol halaman yang terbuka
    })
  );
});

// 3. Fetch Event (Intercept Network Requests) - Cache First Strategy
self.addEventListener('fetch', event => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') {
    return;
  }

  console.log('[Service Worker] Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jika ada di cache, kembalikan dari cache
        if (cachedResponse) {
          console.log('[Service Worker] Returning from cache:', event.request.url);
          return cachedResponse;
        }

        // Jika tidak ada di cache, coba ambil dari jaringan
        console.log('[Service Worker] Requesting from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Jika berhasil dari jaringan, simpan ke cache untuk nanti
            // Kita perlu clone response karena response hanya bisa dibaca sekali
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[Service Worker] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });
            return networkResponse; // Kembalikan response asli ke browser
          }
        ).catch(error => {
          // Gagal fetch dari jaringan (mungkin offline)
          console.warn('[Service Worker] Fetch failed; returning offline fallback or error', error);
          // Opsional: Kembalikan halaman offline custom jika ada
          // return caches.match('/offline.html');
        });
      })
  );
});