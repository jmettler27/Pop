'use server';

import CreateQuestionService from '@/backend/services/create-question/CreateQuestionService';

export const submitQuestion = async (data, userId, files = {}) => {
  const service = new CreateQuestionService(data.type);
  return await service.submitQuestion(data, userId, files);
};

export const editQuestion = async (data, questionId, files = {}) => {
  const service = new CreateQuestionService(data.type);
  return await service.editQuestion(questionId, data, files);
};
