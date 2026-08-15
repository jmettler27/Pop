import { useQuery } from '@tanstack/react-query';

export function useFirestoreCount(getCount: () => Promise<number>, queryKey: readonly unknown[]) {
  return useQuery({
    queryKey: ['firestore', 'count', ...queryKey],
    queryFn: getCount,
    staleTime: 30_000,
  });
}
