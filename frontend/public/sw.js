// public/sw.js

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Listen for messages from the main app
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, icon } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: icon || "/icon.png",
        badge: "/icon.png",
        vibrate: [200, 100, 200], // vibration on Android
      })
    );
  }
});