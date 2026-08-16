import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';

export function useQuestionPlayers(repo: GameBuzzerQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameBuzzerQuestionRepository.BUZZER_PLAYERS_PATH]) : null
  );
  return { data, loading: isLoading, error };
}
