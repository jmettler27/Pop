'use server';

import GameMatchingQuestionService from '@/backend/services/question/matching/GameMatchingQuestionService';
import { ColumnIndices, MatchingEdgeData } from '@/models/questions/matching';

export const submitMatch = async (
  gameId: string,
  roundId: string,
  questionId: string,
  playerId: string,
  edges: MatchingEdgeData[],
  match: ColumnIndices | null
) => {
  const service = new GameMatchingQuestionService(gameId, roundId);
  return service.submitMatch(questionId, playerId, edges, match);
};
