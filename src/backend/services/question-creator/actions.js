'use server';

import QuestionCreatorService from '@/backend/services/question-creator/QuestionCreatorService';

export const submitQuestion = async (data, userId, files = {}) => {
  const service = new QuestionCreatorService(data.type);
  return await service.submitQuestion(data, userId, files);
};
