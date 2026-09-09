import { useMemo } from 'react';

import { collection, query } from 'firebase/firestore';

import { firestore } from '@/firebase/client';
import { useFirestoreCollectionOnce } from '@/hooks/firestore/useFirestoreCollection';
import { Organizer } from '@/models/users/organizer';
import { type ParticipantData } from '@/models/users/participant';

function organizersRef(gameId: string) {
  return collection(firestore, 'games', gameId, 'organizers');
}

export function useAllOrganizersOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(organizersRef(gameId)) : null, [
    gameId,
    'organizers',
  ]);
  // Memoized on `data` so the array/instances stay referentially stable across renders when the
  // underlying data hasn't changed.
  const organizers = useMemo(() => data?.map((o) => new Organizer(o as unknown as ParticipantData)) ?? [], [data]);
  return { organizers, loading: isLoading, error };
}
