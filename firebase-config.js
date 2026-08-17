// IELTS Prep CBT — Firebase web initialization
// Firebase Authentication is intentionally NOT used.
// Custom authentication will be handled by our backend + Resend.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCSCmYw1dzjxhc1_UnOaT13Jhq88LJMXWg",
  authDomain: "ielts-prep-cbt.firebaseapp.com",
  projectId: "ielts-prep-cbt",
  storageBucket: "ielts-prep-cbt.firebasestorage.app",
  messagingSenderId: "352871024515",
  appId: "1:352871024515:web:d11788f6328f993fec18b6"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
