import { query, where } from 'firebase/firestore';

import type TeamRepository from '@/backend/repositories/user/TeamRepository';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import Team, { type TeamData } from '@/models/team';

export function useTeam(repo: TeamRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(id) : null);
  return { team: data ? new Team(data as unknown as TeamData) : null, loading: isLoading, error };
}

export function useTeamOnce(repo: TeamRepository | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(id) : null);
  return { team: data ? new Team(data as unknown as TeamData) : null, loading: isLoading, error };
}

export function useAllTeams(repo: TeamRepository | null) {
  const { data, isLoading, error } = useFirestoreCollection(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return { teams: data?.map((t) => new Team(t as unknown as TeamData)) ?? [], loading: isLoading, error };
}

export function useAllTeamsOnce(repo: TeamRepository | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(repo ? query(repo.collectionRef) : null, [
    repo?.collectionRef.path ?? null,
  ]);
  return { teams: data?.map((t) => new Team(t as unknown as TeamData)) ?? [], loading: isLoading, error };
}

export function useJoinableTeams(repo: TeamRepository | null) {
  const { data, isLoading, error } = useFirestoreCollection(
    repo ? query(repo.collectionRef, where('teamAllowed', '==', true)) : null,
    [repo?.collectionRef.path ?? null, 'teamAllowed', true]
  );
  return { teams: data?.map((t) => new Team(t as unknown as TeamData)) ?? [], loading: isLoading, error };
}
