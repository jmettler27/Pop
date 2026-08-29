import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getEditableQuestion } from '@/backend/services/question/editable-actions';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

/**
 * A single `questions/{id}` doc for the in-game round editor, via an organizer-gated
 * server action — production Firestore rules deny the client reading `questions/{id}`.
 * Cached indefinitely; after editing the question, invalidate
 * `['editableQuestion', gameId, questionId]` to refresh.
 */
export function useEditableQuestion(gameId: string | undefined, questionId: string | undefined) {
  const enabled = Boolean(gameId && questionId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['editableQuestion', gameId, questionId],
    queryFn: () => getEditableQuestion(gameId as string, questionId as string),
    enabled,
    staleTime: Infinity,
  });

  const baseQuestion = useMemo(
    () => (data ? (QuestionFactory.createBaseQuestion(data.type as QuestionType, data) as AnyBaseQuestion) : null),
    [data]
  );

  return { baseQuestion, baseQuestionLoading: enabled && isLoading, baseQuestionError: error };
}
