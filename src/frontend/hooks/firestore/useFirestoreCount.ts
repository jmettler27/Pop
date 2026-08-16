import { useQuery } from '@tanstack/react-query';

// Wraps any repository's plain `getCount(...)`-style async method (e.g. BaseQuestionRepository.
// getQuestionsCount) with TanStack's cache — the repository builds + runs the getCountFromServer() call,
// this hook only adds cache/loading/error state. No live variant: Firestore aggregation queries don't
// support onSnapshot, so a short staleTime is the only lever for freshness — getCountFromServer is billed
// per call, so this avoids re-billing on every remount/navigation.
export function useFirestoreCount(getCount: () => Promise<number>, queryKey: readonly unknown[]) {
  return useQuery({
    queryKey: ['firestore', 'count', ...queryKey],
    queryFn: getCount,
    staleTime: 30_000,
  });
}
