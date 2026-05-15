import { increment, type Transaction } from 'firebase/firestore';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { RoundScores, Scores, ScoresProgress } from '@/models/scores';

export default class RoundScoreRepository extends FirebaseDocumentRepository {
  constructor(gameId: string, roundId: string) {
    super(['games', gameId, 'rounds', roundId, 'realtime', 'scores']);
  }

  async getScoresTransaction(transaction: Transaction): Promise<RoundScores | undefined> {
    const data = await this.getTransaction(transaction);
    return data as RoundScores | undefined;
  }

  async updateScoresTransaction(transaction: Transaction, scores: Record<string, unknown>): Promise<void> {
    await this.updateTransaction(transaction, scores);
  }

  async initializeScoresTransaction(transaction: Transaction): Promise<void> {
    await this.setTransaction(transaction, {
      gameSortedTeams: [],
      rankingDiffs: {},
      roundSortedTeams: [],
      roundCompletionRates: {},
      scores: {},
      scoresProgress: {},
    });
  }

  async resetScores(initTeamRoundScores: Scores): Promise<void> {
    await this.update({
      scores: initTeamRoundScores,
      scoresProgress: {},
      teamsScoresSequences: {},
      roundCompletionRates: {},
      roundSortedTeams: [],
      gameSortedTeams: [],
    });
  }

  async resetScoresTransaction(transaction: Transaction, initTeamRoundScores: Scores): Promise<void> {
    await this.updateTransaction(transaction, {
      scores: initTeamRoundScores,
      scoresProgress: {},
      teamsScoresSequences: {},
      roundCompletionRates: {},
      roundSortedTeams: [],
      gameSortedTeams: [],
    });
  }

  async increaseTeamScoreTransaction(
    transaction: Transaction,
    questionId: string,
    teamId: string | null = null,
    points: number = 0
  ): Promise<void> {
    const roundScores = await this.getTransaction(transaction);
    if (!roundScores) return;
    const currRoundScores = roundScores.scores as Scores;
    const currRoundProgress = (roundScores.scoresProgress ?? {}) as ScoresProgress;
    const newRoundProgress: ScoresProgress = {};
    for (const tid of Object.keys(currRoundScores)) {
      newRoundProgress[tid] = {
        ...currRoundProgress[tid],
        [questionId]: currRoundScores[tid] + (tid === teamId ? points : 0),
      };
    }
    await this.updateTransaction(transaction, {
      [`scores.${teamId}`]: increment(points),
      scoresProgress: newRoundProgress,
    });
  }

  useScores() {
    const { data, loading, error } = super.useDocument();
    return { roundScores: data, loading, error };
  }

  useScoresOnce() {
    const { data, loading, error } = super.useDocumentOnce();
    return { roundScores: data, loading, error };
  }
}
