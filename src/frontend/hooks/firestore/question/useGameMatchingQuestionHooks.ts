import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { GameMatchingQuestion } from '@/models/questions/matching';

export function useCorrectMatches(repo: GameMatchingQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]) : null
  );
  return { correctMatches: data ? data.correctMatches : [], loading: isLoading, error };
}

export function useIncorrectMatches(repo: GameMatchingQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]) : null
  );
  return { incorrectMatches: data ? data.incorrectMatches : [], loading: isLoading, error };
}

export function usePartiallyCorrectMatches(repo: GameMatchingQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    repo ? repo.getDocumentRef([questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH]) : null
  );
  return { partiallyCorrectMatches: data ? data.partiallyCorrectMatches : [], loading: isLoading, error };
}

export function useIsCanceled(repo: GameMatchingQuestionRepository | null, questionId: string, teamId: string) {
  const { gameQuestion, loading, error } = useQuestion(repo, questionId);
  if (loading || error) return { isCanceled: false, loading, error };
  const q = gameQuestion as GameMatchingQuestion | null;
  return {
    isCanceled: q
      ? (q.teamNumMistakes as Record<string, number>)[teamId] >=
        (q.constructor as typeof GameMatchingQuestion).MAX_NUM_MISTAKES
      : false,
    loading,
    error,
  };
}
