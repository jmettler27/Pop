'use server';

import GameOddOneOutQuestionService from '@/backend/services/question/odd-one-out/GameOddOneOutQuestionService';

export const selectProposal = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  idx: number
) => {
  const service = new GameOddOneOutQuestionService(gameId, roundId);
  return service.selectProposal(questionId, playerId, idx);
};
