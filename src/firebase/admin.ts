import 'server-only';

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

// Emulator storage bucket mirrors the client SDK config in `src/firebase/firebase.ts`
// so manually-built download URLs match what `getDownloadURL()` produced before.
const EMULATOR_STORAGE_BUCKET = 'demo-pop.appspot.com';

if (useEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
  // Lets `adminAuth().createCustomToken()` mint an unsigned emulator token (no
  // service-account key is configured for the demo project).
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

let cachedApp: App | null | undefined;

/**
 * Lazily initialise (or reuse) the single `firebase-admin` app.
 *
 * Returns `null` in production when admin credentials are not configured: the
 * NextAuth Firestore adapter is optional (JWT sessions work without it), so this
 * degrades gracefully rather than throwing. Callers that genuinely require admin
 * (backend custom-token minting) use `adminAuth()`, which does throw.
 */
function resolveAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  if (useEmulators) {
    cachedApp = initializeApp({ projectId: 'demo-pop', storageBucket: EMULATOR_STORAGE_BUCKET });
    return cachedApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY) : undefined;
  if (!projectId || !clientEmail || !privateKey) {
    cachedApp = null;
    return cachedApp;
  }

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  return cachedApp;
}

/** The initialised `firebase-admin` app, or `null` when credentials are not configured. */
export function adminApp(): App | null {
  return resolveAdminApp();
}

/**
 * Admin Auth service. Throws when admin credentials are missing: callers that
 * need it (minting the backend Firebase custom token) cannot function without
 * it, so failing loudly beats silently skipping authentication.
 */
export function adminAuth(): Auth {
  const app = resolveAdminApp();
  if (!app) {
    throw new Error(
      'firebase-admin is not configured: set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
    );
  }
  return getAuth(app);
}

/** Admin Firestore, or `null` when admin credentials are not configured. */
export function adminFirestore(): Firestore | null {
  const app = resolveAdminApp();
  return app ? getFirestore(app) : null;
}

/**
 * Admin Firestore, guaranteed non-null — the backend data-access layer's single
 * handle. Throws when admin credentials are missing; production always has them
 * (and the emulator path in this file supplies a `projectId`), so call sites stay
 * free of null checks.
 */
export function adminDb(): Firestore {
  const db = adminFirestore();
  if (!db) {
    throw new Error(
      'firebase-admin is not configured: set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
    );
  }
  return db;
}

/**
 * The default Storage bucket, guaranteed non-null. Throws when admin credentials
 * are missing (same contract as `adminDb`). The bucket name comes from the app's
 * `storageBucket` option set above.
 */
export function adminStorageBucket() {
  const app = resolveAdminApp();
  if (!app) {
    throw new Error(
      'firebase-admin is not configured: set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
    );
  }
  return getStorage(app).bucket();
}
