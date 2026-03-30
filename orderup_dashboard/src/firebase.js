import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
