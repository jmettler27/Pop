import { useMemo } from 'react';

import { orderBy, query, where } from 'firebase/firestore';

import type BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { useFirestoreCollectionPage } from '@/frontend/hooks/firestore/useFirestoreCollectionPage';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory from '@/models/questions/QuestionFactory';

export function useQuestion(repo: BaseQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(questionId) : null);
  return {
    baseQuestion: data ? QuestionFactory.createBaseQuestion(data.type as QuestionType, data) : null,
    baseQuestionLoading: isLoading,
    baseQuestionError: error,
  };
}

export function useQuestionOnce(repo: BaseQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(questionId) : null);
  return {
    baseQuestion: data ? QuestionFactory.createBaseQuestion(data.type as QuestionType, data) : null,
    baseQuestionLoading: isLoading,
    baseQuestionError: error,
  };
}

// One page of questions of this type, newest first — returns useInfiniteQuery's native shape
// ({ data: { pages, pageParams }, fetchNextPage, hasNextPage, isLoading, ... }) rather than forcing it
// back into the old single-page contract, since QuestionSearchTable is this hook's only consumer and
// owns page-index bookkeeping itself (indexing into `data.pages`), see the migration plan. Unlike the
// other hooks here, `repo` is required (not nullable) — QuestionSearchTable always constructs its own
// BaseQuestionRepository unconditionally, so there's no early-return-guarded call site to null-guard.
export function useQuestionsPage(repo: BaseQuestionRepository, approved: boolean, pageSize: number) {
  const result = useFirestoreCollectionPage(
    () =>
      query(
        repo.collectionRef,
        where('type', '==', repo.questionType),
        where('approved', '==', approved),
        orderBy('createdAt', 'desc')
      ),
    pageSize,
    [repo.collectionRef.path, repo.questionType, approved]
  );

  // Map each page's raw docs through QuestionFactory, same as every other hook here — done via useMemo
  // rather than inside queryFn so the cached raw docs stay serializable/reusable across re-renders. Built
  // as a single ternary (not a separately-typed `pages` variable spread conditionally into `result.data`)
  // so TypeScript doesn't widen `data.pages[].items` into a union of the mapped and raw doc shapes.
  const data = useMemo(
    () =>
      result.data
        ? {
            ...result.data,
            pages: result.data.pages.map((page) => ({
              ...page,
              items: page.items.map((d) => QuestionFactory.createBaseQuestion(d.type as QuestionType, d)),
            })),
          }
        : undefined,
    [result.data]
  );

  return { ...result, data };
}
