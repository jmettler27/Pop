'use server';

import GameMCQQuestionService from '@/backend/services/question/mcq/GameMCQQuestionService';

export const selectChoice = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  teamId: string,
  choiceIdx: number
) => {
  const service = new GameMCQQuestionService(gameId, roundId);
  return service.selectChoice(questionId, playerId, teamId, choiceIdx);
};
