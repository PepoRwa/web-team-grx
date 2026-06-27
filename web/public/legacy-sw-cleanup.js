/* Purge ancienne PWA Vite (service worker + caches) */
;(function () {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (r) { r.unregister() })
  })

  if ('caches' in window) {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k) })
    })
  }

  /* Enregistre le SW tueur pour remplacer l'ancien */
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(function () {})
})()
