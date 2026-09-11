import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Flutter Android config + authDomain.
 * İstersen Firebase Console'da Web app ekleyip EXPO_PUBLIC_* ile override et.
 */
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
    'AIzaSyDNLz3xvyVu6adF7ZsopXfgh5ssfmIkgmw',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    'evrywhere-85bc5.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'evrywhere-85bc5',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    'evrywhere-85bc5.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '7631085656',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ??
    '1:7631085656:android:105d13bc5c6ed159c32a2d',
};

const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

function createAuth(firebaseApp: FirebaseApp): Auth {
  try {
    // Metro RN koşulu bu export'u sağlar; web typings'de yok.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rnAuth = require('@firebase/auth/dist/rn/index.js') as {
      getReactNativePersistence: (s: typeof AsyncStorage) => unknown;
      initializeAuth: typeof initializeAuth;
    };
    return rnAuth.initializeAuth(firebaseApp, {
      persistence: rnAuth.getReactNativePersistence(AsyncStorage) as never,
    });
  } catch {
    try {
      return initializeAuth(firebaseApp);
    } catch {
      return getAuth(firebaseApp);
    }
  }
}

const auth = createAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
