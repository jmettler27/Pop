import type ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useReady(repo: ReadyRepository | null) {
  const { data, isLoading, error } = useFirestoreDocument(repo?.docRef ?? null);
  return { ready: data, readyLoading: isLoading, readyError: error };
}
