'use server';

import GameQuestionServiceFactory from '@/backend/services/question/GameQuestionServiceFactory';
import { QuestionType } from '@/models/questions/question-type';

export const endQuestion = async (gameId: string, roundId: string, questionId: string, questionType: QuestionType) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.endQuestion(questionId);
};

export const resetQuestion = async (
  gameId: string,
  roundId: string,
  questionId: string,
  questionType: QuestionType
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.resetQuestion(questionId);
};

export const handleCountdownEnd = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(questionType, gameId, roundId);
  await gameQuestionService.handleCountdownEnd(questionId);
};
