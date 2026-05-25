'use server';

import CreateQuestionService from '@/backend/services/create-question/CreateQuestionService';
import { CreateBaseQuestionData } from '@/models/questions/question';

export const submitQuestion = async (data: CreateBaseQuestionData, userId: string, files: any = {}) => {
  const service = new CreateQuestionService(data.type);
  return await service.submitQuestion(data, userId, files);
};

export const editQuestion = async (data: CreateBaseQuestionData, questionId: string, files: any = {}) => {
  const service = new CreateQuestionService(data.type);
  return await service.editQuestion(questionId, data, files);
};
