'use server';

import EmojiRoundService from '@/backend/services/round/emoji/EmojiRoundService';

export const handleRoundSelected = async (gameId, roundId, userId) => {
  const service = new EmojiRoundService(gameId);
  return service.handleRoundSelected(userId);
};

export const startRound = async (gameId, roundId) => {
  const service = new EmojiRoundService(gameId);
  return service.startRound(roundId);
};

export const handleQuestionEnd = async (gameId, roundId, questionId) => {
  const service = new EmojiRoundService(gameId);
  return service.handleQuestionEnd(roundId, questionId);
};

export const endRound = async (gameId, roundId) => {
  const service = new EmojiRoundService(gameId);
  return service.endRound();
};

/* =============================================================================================================== */
