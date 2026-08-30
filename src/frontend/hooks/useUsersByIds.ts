import { useQuery } from '@tanstack/react-query';

import { getUsers } from '@/frontend/api';

/**
 * Fetches public display fields (name, avatar) for a set of user ids via the Go
 * backend (`GET /users`). Replaces direct client reads of `users/**`, which
 * production Firestore rules deny. Ids are de-duped and sorted so the query key
 * is stable regardless of call-site ordering; the result is cached indefinitely
 * (names/avatars rarely change within a session).
 */
export function useUsersByIds(userIds: Array<string | undefined | null>) {
  const ids = [...new Set(userIds.filter((id): id is string => typeof id === 'string' && id.length > 0))].sort();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'byIds', ids],
    queryFn: () => getUsers(ids),
    enabled: ids.length > 0,
    staleTime: Infinity,
  });

  return { users: data ?? [], loading: ids.length > 0 && isLoading, error };
}
