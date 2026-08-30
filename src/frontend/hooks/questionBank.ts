import { useMemo } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { countQuestions, listQuestions, type QuestionBankItem } from '@/frontend/api';
import { isoToFirestoreTimestamp } from '@/frontend/helpers/time';
import { type BaseQuestionData } from '@/models/questions/question';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

/** Wire item → the shape `QuestionFactory.createBaseQuestion` reconstructs from. */
const toBaseQuestionData = (item: QuestionBankItem): BaseQuestionData => ({
  ...item,
  createdAt: isoToFirestoreTimestamp(item.createdAt),
});

/**
 * One offset page of the approved question bank, reconstructed into model instances.
 * Fetched from the Go backend (`GET /questions`) — production Firestore rules deny
 * the client querying `questions` directly. Organizer-only (the question-bank search table).
 */
export function useApprovedQuestionsPage(questionType: QuestionType, pageSize: number, pageIndex: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['questionBank', 'page', questionType, pageSize, pageIndex],
    queryFn: () => listQuestions(questionType, pageSize, pageIndex),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const items = useMemo(
    () =>
      (data?.items ?? []).map(
        (raw) =>
          QuestionFactory.createBaseQuestion(raw.type as QuestionType, toBaseQuestionData(raw)) as AnyBaseQuestion
      ),
    [data]
  );

  return { items, hasMore: data?.hasMore ?? false, loading: isLoading, error };
}

export function useApprovedQuestionsCount(questionType: QuestionType) {
  const { data } = useQuery({
    queryKey: ['questionBank', 'count', questionType],
    queryFn: () => countQuestions(questionType),
    staleTime: 60_000,
  });
  return data?.count;
}
