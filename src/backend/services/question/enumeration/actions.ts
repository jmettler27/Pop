'use server';

import GameEnumerationQuestionService from '@/backend/services/question/enumeration/GameEnumerationQuestionService';
import { SubmitEnumerationBet } from '@/models/questions/enumeration';

export const addBet = async (gameId: string, roundId: string, questionId: string, bet: SubmitEnumerationBet) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.addBet(questionId, bet);
};

export const endThinking = async (gameId: string, roundId: string, questionId: string) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.endThinking(questionId);
};

export const validateItem = async (gameId: string, roundId: string, questionId: string, itemIdx: number) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.validateItem(questionId, itemIdx);
};

export const incrementValidItems = async (gameId: string, roundId: string, questionId: string, organizerId: string) => {
  const service = new GameEnumerationQuestionService(gameId, roundId);
  return service.incrementValidItems(questionId, organizerId);
};
