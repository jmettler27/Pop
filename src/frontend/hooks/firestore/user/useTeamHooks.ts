import { collection, doc, query, where } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreCollection, useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import Team, { type TeamData } from '@/models/team';

function teamsRef(gameId: string) {
  return collection(firestore, 'games', gameId, 'teams');
}

export function useTeam(gameId: string | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocument(gameId ? doc(teamsRef(gameId), id) : null);
  return { team: data ? new Team(data as unknown as TeamData) : null, loading: isLoading, error };
}

export function useTeamOnce(gameId: string | null, id: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(gameId ? doc(teamsRef(gameId), id) : null);
  return { team: data ? new Team(data as unknown as TeamData) : null, loading: isLoading, error };
}

export function useAllTeams(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollection(gameId ? query(teamsRef(gameId)) : null, [gameId, 'teams']);
  return { teams: data?.map((t) => new Team(t as unknown as TeamData)) ?? [], loading: isLoading, error };
}

export function useAllTeamsOnce(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollectionOnce(gameId ? query(teamsRef(gameId)) : null, [
    gameId,
    'teams',
  ]);
  return { teams: data?.map((t) => new Team(t as unknown as TeamData)) ?? [], loading: isLoading, error };
}

export function useJoinableTeams(gameId: string | null) {
  const { data, isLoading, error } = useFirestoreCollection(
    gameId ? query(teamsRef(gameId), where('teamAllowed', '==', true)) : null,
    [gameId, 'teams', 'teamAllowed', true]
  );
  return { teams: data?.map((t) => new Team(t as unknown as TeamData)) ?? [], loading: isLoading, error };
}
