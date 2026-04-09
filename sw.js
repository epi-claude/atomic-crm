// Kill-switch service worker.
// Replaces the old PWA service worker, clears all caches, then unregisters itself.
// Users are automatically redirected to the fresh page — no action required.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((c) => c.navigate(c.url));
});
