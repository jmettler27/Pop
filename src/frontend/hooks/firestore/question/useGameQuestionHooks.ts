import type GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import { useFirestoreDocument, useFirestoreDocumentOnce } from '@/frontend/hooks/firestore/useFirestoreDocument';
import QuestionFactory, { type AnyGameQuestion } from '@/models/questions/QuestionFactory';

export function useQuestion(repo: GameQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocument(repo ? repo.getDocumentRef(questionId) : null);
  return {
    gameQuestion: data ? (QuestionFactory.createGameQuestion(repo!.questionType, data) as AnyGameQuestion) : null,
    loading: isLoading,
    error,
  };
}

export function useQuestionOnce(repo: GameQuestionRepository | null, questionId: string) {
  const { data, isLoading, error } = useFirestoreDocumentOnce(repo ? repo.getDocumentRef(questionId) : null);
  return {
    gameQuestion: data ? (QuestionFactory.createGameQuestion(repo!.questionType, data) as AnyGameQuestion) : null,
    loading: isLoading,
    error,
  };
}
