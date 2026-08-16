import type GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useScores(repo: GameScoreRepository | null) {
  const { data, isLoading, error } = useFirestoreDocument(repo?.docRef ?? null);
  return { gameScores: data, loading: isLoading, error };
}

export function useScoresOnce(repo: GameScoreRepository | null) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo?.docRef ?? null);
  return { gameScores: data, loading: isLoading, error };
}
