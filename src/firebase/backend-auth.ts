import { signInWithCustomToken } from 'firebase/auth';

import { logger } from '@/backend/logger';
import { adminAuth } from '@/firebase/admin';
import { firebaseAuth } from '@/firebase/firebase';

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === 'true';

/** Firebase Auth uid for the trusted backend. Arbitrary — no user record needed. */
const BACKEND_UID = 'pop-backend';
/**
 * Custom-claim key the security rules check (`request.auth.token.backend`).
 * Keep in sync with `firestore.prod.rules`, `storage.prod.rules` and
 * `database.prod.rules.json`.
 */
const BACKEND_CLAIM = 'backend';

const log = logger.child({ module: 'backend-auth' });

let authReady: Promise<void> | null = null;

/**
 * Ensures the server-side Firebase client SDK is signed in as the dedicated
 * backend identity (uid `pop-backend`, custom claim `{ backend: true }`), so that
 * Firestore / RTDB / Storage security rules can gate writes to it.
 *
 * No-op under the emulators (plan Option B: emulator rulesets stay permissive).
 *
 * Memoised: one `createCustomToken` + `signInWithCustomToken` per cold start.
 * Once `currentUser` is the backend identity, subsequent calls resolve
 * immediately. A failed attempt clears the memo so the next call retries.
 */
export function ensureBackendAuth(): Promise<void> {
  if (useEmulators) return Promise.resolve();
  if (firebaseAuth.currentUser?.uid === BACKEND_UID) return Promise.resolve();

  authReady ??= (async () => {
    const token = await adminAuth().createCustomToken(BACKEND_UID, { [BACKEND_CLAIM]: true });
    await signInWithCustomToken(firebaseAuth, token);
    log.info({ uid: BACKEND_UID }, 'Backend Firebase identity signed in');
  })().catch((err) => {
    authReady = null;
    log.error({ err }, 'Backend Firebase sign-in failed');
    throw err;
  });

  return authReady;
}
