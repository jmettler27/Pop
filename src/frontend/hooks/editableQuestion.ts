import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getEditableQuestions } from '@/backend/services/question/editable-actions';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

/**
 * Full `questions/{id}` docs for the in-game round editor, via an organizer-gated server
 * action (production Firestore rules deny the client reading `questions/{id}`). Fetched a
 * whole round at once so every card shares a single request. Cached indefinitely; after
 * editing a question, invalidate `['editableQuestions', gameId]` to refresh.
 */
export function useEditableQuestions(gameId: string | undefined, questionIds: string[]) {
  const idsKey = [...questionIds].sort().join(',');
  const enabled = Boolean(gameId && questionIds.length);

  // `idsKey` is the order-independent identity of `questionIds` — the array itself is a
  // fresh reference every render and can't go in the key.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data, isLoading, error } = useQuery({
    queryKey: ['editableQuestions', gameId, idsKey],
    queryFn: () => getEditableQuestions(gameId as string, questionIds),
    enabled,
    staleTime: Infinity,
  });

  return { questionsById: data ?? {}, loading: enabled && isLoading, error };
}

/**
 * One question out of the editor batch. Pass `siblingIds` (the round's question ids) so it
 * rides the same request as the other cards; without them it fetches just this question
 * (the "add existing question" preview).
 */
export function useEditableQuestion(gameId: string | undefined, questionId: string | undefined, siblingIds?: string[]) {
  const ids = siblingIds?.length ? siblingIds : questionId ? [questionId] : [];
  const { questionsById, loading, error } = useEditableQuestions(gameId, ids);

  const raw = questionId ? questionsById[questionId] : undefined;
  const baseQuestion = useMemo(
    () => (raw ? (QuestionFactory.createBaseQuestion(raw.type as QuestionType, raw) as AnyBaseQuestion) : null),
    [raw]
  );

  return { baseQuestion, baseQuestionLoading: loading && !raw, baseQuestionError: error };
}
