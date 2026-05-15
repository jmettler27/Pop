import { RoundType } from '@/models/rounds/round-type';
import { Scores } from '@/models/scores';

export const sortScores = (scores: Scores, ascending: boolean): number[] =>
  [...new Set(Object.values(scores))].sort((a, b) => (ascending ? a - b : b - a));

export const sortAscendingRoundScores = (roundType: string): boolean => {
  switch (roundType) {
    case RoundType.ODD_ONE_OUT:
    case RoundType.MATCHING:
      return true;
    default:
      return false;
  }
};
