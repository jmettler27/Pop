"use server";

import QuestionCreatorService from '@/backend/services/question-creator/QuestionCreatorService';

export const submitQuestion = async (data, files = {}) => {
    const service = new QuestionCreatorService();
    return await service.submitQuestion(data, files);
}
