import { RoundType } from '@/models/rounds/RoundType';

export const sortScores = (scores, ascending) =>
  [...new Set(Object.values(scores))].sort((a, b) => (ascending ? a - b : b - a));

export const sortAscendingRoundScores = (roundType) => {
  switch (roundType) {
    case RoundType.ODD_ONE_OUT:
    case RoundType.MATCHING:
      return true;
    default:
      return false;
  }
};
