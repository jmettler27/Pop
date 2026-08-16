import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useQuestionPlayers(repo: GameEnumerationQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH]) : null
  );
  return { data, loading: isLoading, error };
}
