import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getApps, initializeApp } from 'firebase/app';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

export const firebaseConfig: FirebaseOptions = {
  apiKey: useEmulators ? 'demo-api-key' : process.env.FIREBASE_API_KEY,
  authDomain: useEmulators ? 'demo-pop.firebaseapp.com' : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: useEmulators
    ? 'http://127.0.0.1:9000?ns=demo-pop-default-rtdb'
    : process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: useEmulators ? 'demo-pop' : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: useEmulators ? 'demo-pop.appspot.com' : process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: useEmulators ? '000000000000' : process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: useEmulators ? '1:000000000000:web:0000000000000000' : process.env.FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const database = getDatabase(firebaseApp);

if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  try {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    connectDatabaseEmulator(database, '127.0.0.1', 9000);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('Connected to Firebase Emulator Suite (projectId:', firebaseConfig.projectId, ')');
  } catch {
    // Emulators already connected (hot reload)
  }
}
