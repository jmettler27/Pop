import { useQuery } from '@tanstack/react-query';

import { getPublicUsersByIds } from '@/backend/services/user/actions';
import { type PublicUser } from '@/backend/services/user/UserService';

/**
 * Fetches public display fields (name, avatar) for a set of user ids via a server
 * action. Replaces direct client reads of `users/**`, which production Firestore
 * rules deny. Ids are de-duped and sorted so the query key is stable regardless of
 * call-site ordering; the result is cached indefinitely (names/avatars rarely change
 * within a session).
 */
export function useUsersByIds(userIds: Array<string | undefined | null>) {
  const ids = [...new Set(userIds.filter((id): id is string => typeof id === 'string' && id.length > 0))].sort();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'byIds', ids],
    queryFn: () => getPublicUsersByIds(ids),
    enabled: ids.length > 0,
    staleTime: Infinity,
  });

  return { users: (data ?? []) as PublicUser[], loading: ids.length > 0 && isLoading, error };
}
