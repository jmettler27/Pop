import { useMemo } from 'react';

import { collection, doc } from 'firebase/firestore';

import { firestore } from '@/firebase/client';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/hooks/firestore/useFirestoreDocument';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyGameQuestion } from '@/models/questions/QuestionFactory';

function gameQuestionsRef(gameId: string, roundId: string) {
  return collection(firestore, 'games', gameId, 'rounds', roundId, 'questions');
}

// Memoized on `data`/`questionType` (mirrors useGame/useRound) so `gameQuestion` stays referentially
// stable across renders when the underlying document hasn't changed.
export function useQuestion(
  gameId: string | null,
  roundId: string | null,
  questionType: QuestionType,
  questionId: string
) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId) : null
  );
  const gameQuestion = useMemo(
    () => (data ? (QuestionFactory.createGameQuestion(questionType, data) as AnyGameQuestion) : null),
    [data, questionType]
  );
  return { gameQuestion, loading: isLoading, error };
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
  const gameQuestion = useMemo(
    () => (data ? (QuestionFactory.createGameQuestion(questionType, data) as AnyGameQuestion) : null),
    [data, questionType]
  );
  return { gameQuestion, loading: isLoading, error };
}

export function useQuestionPlayers(gameId: string | null, roundId: string | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(
    gameId && roundId ? doc(gameQuestionsRef(gameId, roundId), questionId, 'realtime', 'players') : null
  );
  return { data, loading: isLoading, error };
}
