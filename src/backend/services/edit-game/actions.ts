'use server';

import EditGameService from '@/backend/services/edit-game/EditGameService';
import { QuestionType } from '@/models/questions/question-type';
import { RoundType } from '@/models/rounds/round-type';

export const addRoundToGame = async (gameId: string, roundTitle: string, roundType: RoundType) => {
  const service = new EditGameService(gameId);
  return service.addRoundToGame(roundTitle, roundType);
};

export const removeRoundFromGame = async (gameId: string, roundId: string) => {
  const service = new EditGameService(gameId);
  return service.removeRoundFromGame(roundId);
};

export const addQuestionToRound = async (gameId: string, roundId: string, questionId: string, managerId: string) => {
  const service = new EditGameService(gameId);
  return service.addQuestionToRound(roundId, questionId, managerId);
};

export const removeQuestionFromRound = async (
  questionType: QuestionType,
  gameId: string,
  roundId: string,
  questionId: string
) => {
  const service = new EditGameService(gameId);
  return service.removeQuestionFromRound(questionType, roundId, questionId);
};

export const updateRound = async (gameId: string, roundId: string, roundData: any) => {
  const service = new EditGameService(gameId);
  return service.updateRound(roundId, roundData);
};

export const updateRoundThinkingTime = async (gameId: string, roundId: string, thinkingTime: number) => {
  const service = new EditGameService(gameId);
  return service.updateRoundThinkingTime(roundId, thinkingTime);
};

export const updateQuestionThinkingTime = async (
  gameId: string,
  questionType: QuestionType,
  roundId: string,
  questionId: string,
  thinkingTime: number
) => {
  const service = new EditGameService(gameId);
  return service.updateQuestionThinkingTime(questionType, roundId, questionId, thinkingTime);
};

export const updateRoundChallengeTime = async (gameId: string, roundId: string, challengeTime: number) => {
  const service = new EditGameService(gameId);
  return service.updateRoundChallengeTime(roundId, challengeTime);
};

export const updateQuestionChallengeTime = async (
  gameId: string,
  questionType: QuestionType,
  roundId: string,
  questionId: string,
  challengeTime: number
) => {
  const service = new EditGameService(gameId);
  return service.updateQuestionChallengeTime(questionType, roundId, questionId, challengeTime);
};

export const launchGame = async (gameId: string) => {
  const service = new EditGameService(gameId);
  return service.launchGame();
};
