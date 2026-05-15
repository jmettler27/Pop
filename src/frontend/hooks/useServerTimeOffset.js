import { useQuery } from '@tanstack/react-query';
import { get } from 'firebase/database';

import { SERVER_TIME_OFFSET_REF } from '@/backend/firebase/database';

export function useServerTimeOffset() {
  const {
    data,
    isPending: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ['serverTimeOffset'],
    queryFn: () => get(SERVER_TIME_OFFSET_REF).then((snap) => snap.val()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    serverTimeOffset: data ?? 0,
    loading,
    error: isError ? error : null,
  };
}
