import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Aynı Firebase projesi (mobil ile).
 * İstersen .env ile VITE_FIREBASE_* override et.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDNLz3xvyVu6adF7ZsopXfgh5ssfmIkgmw',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    'evrywhere-85bc5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'evrywhere-85bc5',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'evrywhere-85bc5.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '7631085656',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:7631085656:android:105d13bc5c6ed159c32a2d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
