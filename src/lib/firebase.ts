import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAulhfmEY_laldOAQwAo-fj-Ueskc-sKNM",
    authDomain: "rkanik-antigravity.firebaseapp.com",
    projectId: "rkanik-antigravity",
    storageBucket: "rkanik-antigravity.firebasestorage.app",
    messagingSenderId: "129741382688",
    appId: "1:129741382688:web:09b6b52ff88a5b218ec845",
    measurementId: "G-H93G82DHS4"
};

// Initialize Firebase
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
