import type RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useScores(repo: RoundScoreRepository | null) {
  const { data, isLoading, error } = useFirestoreDocument(repo?.docRef ?? null);
  return { roundScores: data, loading: isLoading, error };
}

export function useScoresOnce(repo: RoundScoreRepository | null) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo?.docRef ?? null);
  return { roundScores: data, loading: isLoading, error };
}
