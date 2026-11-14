// Service worker de Torrons Motoristas: solo para mostrar avisos y abrir la app al tocarlos.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    const c = l.find(x => x.url.includes('motoristas')); if (c) return c.focus();
    return self.clients.openWindow('motoristas.html');
  }));
});
