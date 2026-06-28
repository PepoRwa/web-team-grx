/* Remplace l'ancien service worker Vite — purge caches + réseau direct */
self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k) }))
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      })
      .then(function (clients) {
        clients.forEach(function (client) { client.navigate(client.url) })
      })
  )
})

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request))
})
