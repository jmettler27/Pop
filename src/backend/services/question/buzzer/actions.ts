'use server';

import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import GameQuestionServiceFactory from '@/backend/services/question/GameQuestionServiceFactory';
import { QuestionType } from '@/models/questions/question-type';

export const handleBuzzerHeadChanged = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(
    questionType,
    gameId,
    roundId
  ) as GameBuzzerQuestionService;
  await gameQuestionService.handleBuzzerHeadChanged(questionId, playerId);
};

export const invalidateAnswer = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(
    questionType,
    gameId,
    roundId
  ) as GameBuzzerQuestionService;
  await gameQuestionService.invalidateAnswer(questionId, playerId);
};

export const validateAnswer = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(
    questionType,
    gameId,
    roundId
  ) as GameBuzzerQuestionService;
  await gameQuestionService.validateAnswer(questionId, playerId);
};

export const addPlayerToBuzzer = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(
    questionType,
    gameId,
    roundId
  ) as GameBuzzerQuestionService;
  await gameQuestionService.addPlayerToBuzzer(questionId, playerId);
};

export const removePlayerFromBuzzer = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string
) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(
    questionType,
    gameId,
    roundId
  ) as GameBuzzerQuestionService;
  await gameQuestionService.removePlayerFromBuzzer(questionId, playerId);
};

export const clearBuzzer = async (questionType: QuestionType, gameId: string, roundId: string, questionId: string) => {
  const gameQuestionService = GameQuestionServiceFactory.createService(
    questionType,
    gameId,
    roundId
  ) as GameBuzzerQuestionService;
  await gameQuestionService.clearBuzzer(questionId);
};
