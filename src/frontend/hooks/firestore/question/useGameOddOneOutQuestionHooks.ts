import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useQuestionPlayers(repo: GameOddOneOutQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameOddOneOutQuestionRepository.ODD_ONE_OUT_PLAYERS_PATH]) : null
  );
  return { data, loading: isLoading, error };
}
