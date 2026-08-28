import 'server-only';

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

if (useEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
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
    cachedApp = initializeApp({ projectId: 'demo-pop' });
    return cachedApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? JSON.parse(process.env.FIREBASE_PRIVATE_KEY) : undefined;
  if (!projectId || !clientEmail || !privateKey) {
    cachedApp = null;
    return cachedApp;
  }

  cachedApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
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
