import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useQuestionPlayers(repo: GameQuoteQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameQuoteQuestionRepository.QUOTE_PLAYERS_PATH]) : null
  );
  return { data, loading: isLoading, error };
}
