import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDYl5EpkVJ-A2KwxnJcNsUwI6xBD0FSpxc",
    authDomain: "realtime-chat-community.firebaseapp.com",
    projectId: "realtime-chat-community",
    storageBucket: "realtime-chat-community.firebasestorage.app",
    messagingSenderId: "110814821910",
    appId: "1:110814821910:web:43df8101f3fc284c677f37"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

console.log("Firebase 初始化成功");