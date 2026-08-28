import { runTransaction, type Firestore, type Transaction, type TransactionOptions } from 'firebase/firestore';

import { ensureBackendAuth } from '@/firebase/backend-auth';

/**
 * `runTransaction`, preceded by `ensureBackendAuth()` so security rules allow the
 * writes. Signature matches `runTransaction` exactly — call sites migrate from
 * `runTransaction(firestore, fn)` to `runBackendTransaction(firestore, fn)` by
 * name only (enforced by `no-restricted-imports` on `firebase/firestore` in
 * `src/backend`, added in Phase 3).
 */
export async function runBackendTransaction<T>(
  db: Firestore,
  updateFunction: (transaction: Transaction) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  await ensureBackendAuth();
  return runTransaction(db, updateFunction, options);
}
