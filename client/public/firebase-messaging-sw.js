/* global importScripts, firebase */
// Firebase Messaging service worker. Config is passed as query params by the
// registering page (see usePushRegistration) so it stays in one place — the
// client .env — rather than being duplicated here. Web config is not secret.
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

const params = new URLSearchParams(location.search);
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

firebase.messaging().onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  if (notification.title) {
    self.registration.showNotification(notification.title, { body: notification.body });
  }
});
