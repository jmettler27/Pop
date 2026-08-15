import { collection, doc } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyGameQuestion } from '@/models/questions/QuestionFactory';

function gameQuestionsRef(gameId: string, roundId: string) {
  return collection(firestore, 'games', gameId, 'rounds', roundId, 'questions');
}

export function useQuestion(
  gameId: string | null,
  roundId: string | null,
  questionType: QuestionType,
  questionId: string
) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId) : null
  );
  return {
    gameQuestion: data ? (QuestionFactory.createGameQuestion(questionType, data) as AnyGameQuestion) : null,
    loading: isLoading,
    error,
  };
}

export function useQuestionOnce(
  gameId: string | null,
  roundId: string | null,
  questionType: QuestionType,
  questionId: string
) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId) : null
  );
  return {
    gameQuestion: data ? (QuestionFactory.createGameQuestion(questionType, data) as AnyGameQuestion) : null,
    loading: isLoading,
    error,
  };
}

export function useQuestionPlayers(gameId: string | null, roundId: string | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId, 'realtime', 'players') : null
  );
  return { data, loading: isLoading, error };
}
