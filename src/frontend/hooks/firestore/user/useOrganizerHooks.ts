import { query } from 'firebase/firestore';

import type OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import { useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { Organizer } from '@/models/users/organizer';
import { type ParticipantData } from '@/models/users/participant';

export function useOrganizer(repo: OrganizerRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(id) : null);
  return { organizer: data ? new Organizer(data as unknown as ParticipantData) : null, loading: isLoading, error };
}

export function useOrganizerOnce(repo: OrganizerRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(id) : null);
  return { organizer: data ? new Organizer(data as unknown as ParticipantData) : null, loading: isLoading, error };
}

export function useAllOrganizersOnce(repo: OrganizerRepository | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return {
    organizers: data?.map((o) => new Organizer(o as unknown as ParticipantData)) ?? [],
    loading: isLoading,
    error,
  };
}

export function useIsOrganizer(repo: OrganizerRepository | null, organizerId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(organizerId) : null);
  return { isOrganizer: data !== null, loading: isLoading, error };
}
