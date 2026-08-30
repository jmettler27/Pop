import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, onSnapshot, type DocumentData, type Query } from 'firebase/firestore';

import { acquireSharedSubscription } from '@/hooks/sharedSubscription';

export type FirestoreDocs<T> = Array<{ id: string } & T>;

async function fetchDocs<T>(q: Query<T>): Promise<FirestoreDocs<T>> {
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as { id: string } & T);
}

// A Firestore Query object has no stable identity, so (unlike the document hooks) the caller must supply
// an explicit queryKey that captures whatever the query is actually filtered/sorted by.
export function useFirestoreCollectionOnce<T = DocumentData>(
  firestoreQuery: Query<T> | null,
  queryKey: readonly unknown[]
) {
  // firestoreQuery itself isn't serializable/stable enough for the key — queryKey already captures every
  // input the caller built the query from (see call sites), which is the identity that actually matters.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: ['firestore', 'collection', ...queryKey],
    queryFn: () => fetchDocs(firestoreQuery!),
    enabled: firestoreQuery !== null,
    staleTime: Infinity,
  });
}

export function useFirestoreCollection<T = DocumentData>(
  firestoreQuery: Query<T> | null,
  queryKey: readonly unknown[]
) {
  const key = ['firestore', 'collection', ...queryKey];
  const keyString = JSON.stringify(key);
  const queryClient = useQueryClient();
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- see useFirestoreCollectionOnce above
  const result = useQuery({
    queryKey: key,
    queryFn: () => fetchDocs(firestoreQuery!),
    enabled: firestoreQuery !== null,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!firestoreQuery) return;
    // Shared per keyString: two components mounting this hook for the same query reuse one onSnapshot
    // listener instead of opening a second, separately-billed one.
    return acquireSharedSubscription(keyString, () =>
      onSnapshot(
        firestoreQuery,
        (snap) =>
          queryClient.setQueryData(
            key,
            snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          ),
        () => queryClient.invalidateQueries({ queryKey: key })
      )
    );
    // Resubscribe on the caller-supplied queryKey's value, not a fresh-but-structurally-identical Query
    // object every render (Query has no public stable identity to key off directly).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyString, queryClient]);

  return result;
}
