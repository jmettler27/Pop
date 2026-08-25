import { collection, doc } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { GameMatchingQuestion } from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';

function gameQuestionsRef(gameId: string, roundId: string) {
  return collection(firestore, 'games', gameId, 'rounds', roundId, 'questions');
}

export function useCorrectMatches(gameId: string | null, roundId: string | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId, 'realtime', 'correct') : null
  );
  return { correctMatches: data ? data.correctMatches : [], loading: isLoading, error };
}

export function useIncorrectMatches(gameId: string | null, roundId: string | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId, 'realtime', 'incorrect') : null
  );
  return { incorrectMatches: data ? data.incorrectMatches : [], loading: isLoading, error };
}

export function usePartiallyCorrectMatches(gameId: string | null, roundId: string | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId, 'realtime', 'partiallyCorrect') : null
  );
  return { partiallyCorrectMatches: data ? data.partiallyCorrectMatches : [], loading: isLoading, error };
}

export function useIsCanceled(gameId: string | null, roundId: string | null, questionId: string, teamId: string) {
  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.MATCHING, questionId);
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
