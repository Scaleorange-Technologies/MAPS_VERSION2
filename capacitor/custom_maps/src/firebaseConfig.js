// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // ✅ Import auth

const firebaseConfig = {
  apiKey: "AIzaSyBKDin8IWffd6zRK9JtfMpKQNwM6pZkzqs",
  authDomain: "riderapp-60c8f.firebaseapp.com",
  projectId: "riderapp-60c8f",
  storageBucket: "riderapp-60c8f.appspot.com",
  messagingSenderId: "75486455312",
  appId: "1:75486455312:web:7689a2a4de9a720ebd0c95",
  measurementId: "G-WDRLBMDZHD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Add these
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; // ✅ Export both
