import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { increment } from 'firebase/database';

export default class RoundScoreRepository extends FirebaseDocumentRepository {
  constructor(gameId, roundId) {
    super(['games', gameId, 'rounds', roundId, 'realtime', 'scores']);
  }

  async getScoresTransaction(transaction) {
    return await this.getTransaction(transaction);
  }

  async updateScoresTransaction(transaction, scores) {
    return await this.updateTransaction(transaction, scores);
  }

  async initializeScoresTransaction(transaction) {
    return await this.setTransaction(transaction, {
      gameSortedTeams: [],
      rankingDiffs: {},
      roundSortedTeams: [],
      scores: {},
      scoresProgress: {},
    });
  }

  async resetScoresTransaction(transaction, initTeamRoundScores) {
    return await this.updateTransaction(transaction, {
      scores: initTeamRoundScores,
      scoresProgress: {},
      teamsScoresSequences: {},
      roundSortedTeams: [],
      gameSortedTeams: [],
    });
  }

  async increaseTeamScoreTransaction(transaction, questionId, teamId = null, points = 0) {
    const roundScores = await this.getTransaction(transaction);
    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

    // Update progress for all teams
    const newRoundProgress = {};
    for (const tid of Object.keys(currRoundScores)) {
      newRoundProgress[tid] = {
        ...currRoundProgress[tid],
        [questionId]: currRoundScores[tid] + (tid === teamId) * points,
      };
    }

    // Update scores
    await this.updateTransaction(transaction, {
      [`scores.${teamId}`]: increment(points),
      scoresProgress: newRoundProgress,
    });
  }

  /* =============================================================================================================== */

  // React hooks for real-time operations
  useScores() {
    const { data, loading, error } = super.useDocument();
    return { roundScores: data, loading, error };
  }

  useScoresOnce() {
    const { data, loading, error } = super.useDocumentOnce();
    return { roundScores: data, loading, error };
  }
}
