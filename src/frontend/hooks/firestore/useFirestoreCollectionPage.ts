import { useInfiniteQuery } from '@tanstack/react-query';
import {
  getDocs,
  limit,
  query,
  startAfter,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export interface FirestorePage<T> {
  items: Array<{ id: string } & T>;
  cursor: QueryDocumentSnapshot<T> | null; // last doc of this page — startAfter() target for the next one
  hasMore: boolean;
}

// `queryBuilder` composes the base filtered/ordered query; called fresh per page (this hook adds its own
// startAfter/limit). `queryKey` must capture every input that defines the *result set* (filters, sort) —
// NOT the cursor/page position, which useInfiniteQuery owns internally via `data.pages`. `pageSize` is
// folded into the cache key automatically, so changing it starts a fresh page set with zero extra code.
export function useFirestoreCollectionPage<T = DocumentData>(
  queryBuilder: () => Query<T>,
  pageSize: number,
  queryKey: readonly unknown[]
) {
  return useInfiniteQuery({
    queryKey: ['firestore', 'collectionPage', ...queryKey, pageSize],
    queryFn: async ({ pageParam }: { pageParam: QueryDocumentSnapshot<T> | null }): Promise<FirestorePage<T>> => {
      const overfetch = pageSize + 1; // fetch one extra to correctly detect hasMore at exact-multiple boundaries
      const base = queryBuilder();
      const q = pageParam ? query(base, startAfter(pageParam), limit(overfetch)) : query(base, limit(overfetch));
      const snap = await getDocs(q);
      const docs = snap.docs.slice(0, pageSize);
      return {
        items: docs.map((d) => ({ id: d.id, ...d.data() }) as { id: string } & T),
        cursor: docs.at(-1) ?? null,
        hasMore: snap.docs.length > pageSize,
      };
    },
    initialPageParam: null as QueryDocumentSnapshot<T> | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
    // maxPages intentionally NOT set: it exists for infinite-scroll's memory/eviction concerns and needs
    // bidirectional cursors to transparently refetch an evicted page. Firestore cursors are forward-only
    // (startAfter) — bidirectional would mean reintroducing a cursor-stack-shaped mechanism, exactly what
    // this hook replaces. Consumers showing one page at a time need Previous to stay instant for any page
    // already visited, so keeping all fetched pages (small arrays, capped at the caller's pageSize each)
    // is the right call.
  });
}
