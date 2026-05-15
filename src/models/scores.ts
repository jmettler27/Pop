export type Scores = Record<string, number>; // teamId -> score

export type ScoresProgress = Record<string, Record<string, number>>; // teamId -> questionId or roundId -> score

export type RankingDifferences = Record<string, number>; // teamId ->

// Aggregates teams with the same score together
export interface ScoreboardItem {
  score: number;
  teams: string[];
}

export interface GameScores {
  gameSortedTeams: ScoreboardItem[];
  scores: Scores;
  scoresProgress: ScoresProgress;
}

export interface RoundScores {
  gameSortedTeams: ScoreboardItem[];
  rankingDiffs: RankingDifferences;
  roundCompletionRates: Record<string, number>;
  roundSortedTeams: ScoreboardItem[];
  scores: Scores;
  scoresProgress: ScoresProgress;
  teamsScoresSequences: Record<string, number[]>; // teamId ->
}
