import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDoc, onSnapshot, type DocumentData, type DocumentReference } from 'firebase/firestore';

export type FirestoreDoc<T> = ({ id: string } & T) | null;

async function fetchDoc<T>(docRef: DocumentReference<T>): Promise<FirestoreDoc<T>> {
  const snap = await getDoc(docRef);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreDoc<T>) : null;
}

// One-shot: staleTime: Infinity — fetch once per distinct docRef.path, served from cache after.
export function useFirestoreDocumentOnce<T = DocumentData>(docRef: DocumentReference<T> | null) {
  // docRef.path (already in queryKey) is the complete identity of a DocumentReference — the object
  // itself doesn't need to also appear in the key, and can't (not serializable/stable for key hashing).
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: ['firestore', 'doc', docRef?.path ?? null],
    queryFn: () => fetchDoc(docRef!),
    enabled: docRef !== null,
    staleTime: Infinity,
  });
}

// Live: useQuery gives the initial read + cache/loading/error plumbing; a parallel onSnapshot
// subscription pushes every server update straight into the cache via queryClient.setQueryData. This is
// the one place code volume goes up vs. react-firebase-hooks, which hid this wiring inside the library.
export function useFirestoreDocument<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const key = ['firestore', 'doc', docRef?.path ?? null];
  const queryClient = useQueryClient();
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- see useFirestoreDocumentOnce above
  const result = useQuery({
    queryKey: key,
    queryFn: () => fetchDoc(docRef!),
    enabled: docRef !== null,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => queryClient.setQueryData(key, snap.exists() ? { id: snap.id, ...snap.data() } : null),
      // No public TanStack API pushes an out-of-band error into a query's `error` field directly;
      // invalidating re-runs queryFn (a real getDoc), which populates `.error` through the normal channel
      // if the failure persists (e.g. a permissions error) — reuses TanStack's own error/retry machinery
      // instead of hand-rolling a parallel error channel.
      () => queryClient.invalidateQueries({ queryKey: key })
    );
    return unsubscribe;
    // Resubscribe on docRef.path (the real stable identity), not a fresh-but-structurally-identical
    // docRef object every render — depending on the object itself would churn the Firestore listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docRef?.path, queryClient]);

  return result;
}
