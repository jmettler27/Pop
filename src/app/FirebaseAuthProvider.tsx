'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { useSession } from 'next-auth/react';

import { logger } from '@/backend/logger';
import { auth } from '@/firebase/firebase';

const log = logger.child({ module: 'firebase-auth' });

/**
 * Bridges the NextAuth session into a Firebase Auth session: fetches a custom
 * token from `/api/auth/firebase-token` and calls `signInWithCustomToken`, so the
 * Firebase client SDK holds an ID token (auto-refreshed) for the Go backend's
 * `Authorization: Bearer` calls. Signs out of Firebase when the NextAuth session
 * ends, and re-signs-in if the Firebase user drifts from the session user.
 */
export default function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const expectedUid = session?.user.id ?? null;
  const signingIn = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;

    return onAuthStateChanged(auth, (firebaseUser) => {
      if (expectedUid && firebaseUser?.uid !== expectedUid && !signingIn.current) {
        signingIn.current = true;
        (async () => {
          try {
            const response = await fetch('/api/auth/firebase-token');
            if (!response.ok) throw new Error(`firebase-token responded ${response.status}`);
            const { token } = (await response.json()) as { token: string };
            await signInWithCustomToken(auth, token);
          } catch (error) {
            log.error({ error }, 'Firebase custom-token sign-in failed');
          } finally {
            signingIn.current = false;
          }
        })();
      } else if (!expectedUid && firebaseUser) {
        signOut(auth).catch((error) => log.error({ error }, 'Firebase sign-out failed'));
      }
    });
  }, [status, expectedUid]);

  return <>{children}</>;
}
