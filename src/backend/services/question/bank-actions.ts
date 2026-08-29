'use server';

import QuestionBankService from '@/backend/services/question/QuestionBankService';
import { type QuestionType } from '@/models/questions/question-type';

/**
 * One offset page of approved questions of the given type, newest first. Replaces
 * the client querying the `questions` collection directly (production Firestore
 * rules deny `list` on `questions`).
 */
export const listApprovedQuestions = async (questionType: QuestionType, pageSize: number, pageIndex: number) => {
  return QuestionBankService.listApproved(questionType, pageSize, pageIndex);
};

export const countApprovedQuestions = async (questionType: QuestionType) => {
  return QuestionBankService.countApproved(questionType);
};
