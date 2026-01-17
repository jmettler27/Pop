export const sortScores = (scores, ascending) =>
  [...new Set(Object.values(scores))].sort((a, b) => (ascending ? a - b : b - a));
