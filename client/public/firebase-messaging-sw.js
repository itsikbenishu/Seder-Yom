/* global importScripts, firebase */
// Firebase Messaging service worker. Config is passed as query params by the
// registering page (see pushRegistration) so it stays in one place — the client
// .env — rather than being duplicated here. Web config is not secret.
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

const params = new URLSearchParams(location.search);
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

// Registers the SDK's background push handler, which renders our notification-type
// payloads on its own. No onBackgroundMessage handler here — calling
// showNotification from one would raise a second, duplicate notification.
firebase.messaging();
