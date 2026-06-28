import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

/**
 * Konfigurasi Firebase — isi lewat .env (lihat .env.example).
 * Ambil nilai-nilai ini dari Firebase Console:
 *   Project Settings > General > Your apps > SDK setup and configuration
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
