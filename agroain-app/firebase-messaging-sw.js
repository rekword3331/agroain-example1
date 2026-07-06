// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAOQp4Ez6omxSL5MDh_cGzzUy1gcf4KkEo",
  authDomain: "agroain.firebaseapp.com",
  databaseURL: "https://agroain-default-rtdb.firebaseio.com",
  projectId: "agroain",
  storageBucket: "agroain.firebasestorage.app",
  messagingSenderId: "837977852518",
  appId: "1:837977852518:web:eebd9baaec310f03e0bba7",
  measurementId: "G-J7CG2Z0TMG"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'  // आप अपना आइकॉन चाहें तो बदल सकते हैं
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});