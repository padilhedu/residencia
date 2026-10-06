/* Recebe o lembrete diário (Web Push) e abre o app na tela certa ao tocar na notificação */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Residência Odonto'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Você tem revisões pendentes hoje.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'revisao-diaria',
      renotify: true,
      data: { url: data.url || '/#/revisao' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) {
          return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w)).catch(() => self.clients.openWindow(url))
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
