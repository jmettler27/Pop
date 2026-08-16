import { useMemo } from 'react';

import { collection, doc, getCountFromServer, orderBy, query, where } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { useFirestoreCollectionPage } from '@/frontend/hooks/firestore/useFirestoreCollectionPage';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory from '@/models/questions/QuestionFactory';

const QUESTIONS_REF = collection(firestore, 'questions');

export function useQuestion(questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(doc(QUESTIONS_REF, questionId));
  return {
    baseQuestion: data ? QuestionFactory.createBaseQuestion(data.type as QuestionType, data) : null,
    baseQuestionLoading: isLoading,
    baseQuestionError: error,
  };
}

export function useQuestionOnce(questionId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(doc(QUESTIONS_REF, questionId));
  return {
    baseQuestion: data ? QuestionFactory.createBaseQuestion(data.type as QuestionType, data) : null,
    baseQuestionLoading: isLoading,
    baseQuestionError: error,
  };
}

// One page of questions of this type, newest first — returns useInfiniteQuery's native shape
// ({ data: { pages, pageParams }, fetchNextPage, hasNextPage, isLoading, ... }) rather than forcing it
// back into a single-page contract, since QuestionSearchTable is this hook's only consumer and owns
// page-index bookkeeping itself (indexing into data.pages).
export function useQuestionsPage(questionType: QuestionType, approved: boolean, pageSize: number) {
  const result = useFirestoreCollectionPage(
    () =>
      query(
        QUESTIONS_REF,
        where('type', '==', questionType),
        where('approved', '==', approved),
        orderBy('createdAt', 'desc')
      ),
    pageSize,
    ['questions', questionType, approved]
  );

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

export async function getQuestionsCount(questionType: QuestionType, approved: boolean): Promise<number> {
  const snapshot = await getCountFromServer(
    query(QUESTIONS_REF, where('type', '==', questionType), where('approved', '==', approved))
  );
  return snapshot.data().count;
}
