import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { countApprovedQuestions, listApprovedQuestions } from '@/backend/services/question/bank-actions';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

/**
 * One offset page of the approved question bank, reconstructed into model instances.
 * Fetched via a server action — production Firestore rules deny the client querying
 * `questions` directly. Organizer-only (the question-bank search table).
 */
export function useApprovedQuestionsPage(questionType: QuestionType, pageSize: number, pageIndex: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['questionBank', 'page', questionType, pageSize, pageIndex],
    queryFn: () => listApprovedQuestions(questionType, pageSize, pageIndex),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const items = (data?.items ?? []).map((raw) =>
    QuestionFactory.createBaseQuestion(raw.type as QuestionType, raw)
  ) as AnyBaseQuestion[];

  return { items, hasMore: data?.hasMore ?? false, loading: isLoading, error };
}

export function useApprovedQuestionsCount(questionType: QuestionType) {
  const { data } = useQuery({
    queryKey: ['questionBank', 'count', questionType],
    queryFn: () => countApprovedQuestions(questionType),
    staleTime: 60_000,
  });
  return data;
}
