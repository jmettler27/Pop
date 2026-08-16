import { collection, doc, query } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { Organizer } from '@/models/users/organizer';
import { type ParticipantData } from '@/models/users/participant';

function organizersRef(gameId: string) {
  return collection(firestore, 'games', gameId, 'organizers');
}

export function useOrganizer(gameId: string | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocument(gameId ? doc(organizersRef(gameId), id) : null);
  return { organizer: data ? new Organizer(data as unknown as ParticipantData) : null, loading: isLoading, error };
}

export function useOrganizerOnce(gameId: string | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(gameId ? doc(organizersRef(gameId), id) : null);
  return { organizer: data ? new Organizer(data as unknown as ParticipantData) : null, loading: isLoading, error };
}

export function useAllOrganizersOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(organizersRef(gameId)) : null, [
    gameId,
    'organizers',
  ]);
  return {
    organizers: data?.map((o) => new Organizer(o as unknown as ParticipantData)) ?? [],
    loading: isLoading,
    error,
  };
}

export function useIsOrganizer(gameId: string | null, organizerId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(gameId ? doc(organizersRef(gameId), organizerId) : null);
  return { isOrganizer: data !== null, loading: isLoading, error };
}
