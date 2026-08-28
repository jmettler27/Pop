import { useMemo } from 'react';

import { collection, doc } from 'firebase/firestore';

import { firestore } from '@/firebase/firebase';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory from '@/models/questions/QuestionFactory';

const QUESTIONS_REF = collection(firestore, 'questions');

// Single `questions/{id}` doc reads (a Firestore `get`, still allowed to the client). Collection
// queries over `questions` are denied by production rules — use `@/frontend/hooks/questionBank`
// (server action) for the bank browser instead.

// Memoized on `data` (mirrors useGame/useRound) so `baseQuestion` stays referentially stable across
// renders when the underlying document hasn't changed.
export function useQuestion(questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(doc(QUESTIONS_REF, questionId));
  const baseQuestion = useMemo(
    () => (data ? QuestionFactory.createBaseQuestion(data.type as QuestionType, data) : null),
    [data]
  );
  return { baseQuestion, baseQuestionLoading: isLoading, baseQuestionError: error };
}

export function useQuestionOnce(questionId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(doc(QUESTIONS_REF, questionId));
  const baseQuestion = useMemo(
    () => (data ? QuestionFactory.createBaseQuestion(data.type as QuestionType, data) : null),
    [data]
  );
  return { baseQuestion, baseQuestionLoading: isLoading, baseQuestionError: error };
}
