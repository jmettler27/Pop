import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onValue, type DatabaseReference } from 'firebase/database';

import { acquireSharedSubscription } from '@/frontend/hooks/sharedSubscription';

// Read once via `onValue`'s `onlyOnce` option, rather than `get()` — `get()` is a REST-based one-time
// read that doesn't support the special client-only `.info/*` paths (e.g. `.info/serverTimeOffset`, this
// hook's original motivating case), throwing "Invalid token in path". `onValue` supports every path,
// `.info/*` included, so it's the one primitive this hook can build both its one-shot read and its live
// subscription on. (A hand-rolled "call the returned unsubscribe from inside the callback" version is a
// trap here: `onValue` can invoke the callback synchronously, before the `const unsubscribe = onValue(...)`
// assignment finishes — a real TDZ ReferenceError, not a hypothetical one. `onlyOnce` sidesteps that by
// letting the SDK detach the listener itself.)
function fetchValueOnce<T>(ref: DatabaseReference): Promise<T | null> {
  return new Promise((resolve, reject) => {
    onValue(
      ref,
      (snap) => resolve(snap.exists() ? (snap.val() as T) : null),
      (error) => reject(error),
      { onlyOnce: true }
    );
  });
}

// Live: useQuery gives the initial read + cache/loading/error plumbing; a parallel onValue
// subscription pushes every server update straight into the cache via queryClient.setQueryData. Mirrors
// useFirestoreDocument's shape, but this is the Realtime Database SDK — a separate connection from
// Firestore, not something the Firestore primitives can be reused for.
export function useRealtimeDatabaseValue<T = unknown>(ref: DatabaseReference | null) {
  // A DatabaseReference has no `.path` like Firestore's DocumentReference — `.toString()` (its full,
  // stable URL) is the closest equivalent complete identity, and is already in the queryKey below.
  const key = ['database', 'value', ref?.toString() ?? null];
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey: key,
    queryFn: () => fetchValueOnce<T>(ref!),
    enabled: ref !== null,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!ref) return;
    // Shared per ref.toString(): two components mounting this hook for the same path reuse one onValue
    // listener instead of opening a second, separately-billed one.
    return acquireSharedSubscription(`rtdb:value:${ref.toString()}`, () =>
      onValue(
        ref,
        (snap) => queryClient.setQueryData(key, snap.exists() ? (snap.val() as T) : null),
        // No public TanStack API pushes an out-of-band error into a query's `error` field directly;
        // invalidating re-runs queryFn (a fresh one-shot read), which populates `.error` through the normal
        // channel if the failure persists (e.g. a permissions error).
        () => queryClient.invalidateQueries({ queryKey: key })
      )
    );
    // Resubscribe on ref.toString() (the stable identity), not a fresh-but-structurally-identical ref
    // object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.toString(), queryClient]);

  return result;
}
