import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { increment } from 'firebase/firestore';

export default class GameScoreRepository extends FirebaseDocumentRepository {
  constructor(gameId) {
    super(['games', gameId, 'realtime', 'scores']);
  }

  async getScoresTransaction(transaction) {
    return await this.getTransaction(transaction);
  }

  async updateScoresTransaction(transaction, scores) {
    return await this.updateTransaction(transaction, scores);
  }

  async setScores(scores) {
    return await this.set(scores);
  }

  async setScoresTransaction(transaction, scores) {
    return await this.setTransaction(transaction, scores);
  }

  async initializeScores() {
    return await this.setScores({
      gameSortedTeams: [],
      scores: {},
      scoresProgress: {},
    });
  }

  async initializeScoresTransaction(transaction) {
    return await this.setScoresTransaction(transaction, {
      gameSortedTeams: [],
      scores: {},
      scoresProgress: {},
    });
  }

  async increaseTeamScoreTransaction(transaction, roundId, teamId = null, points = 0) {
    const gameScores = await this.getTransaction(transaction);
    const currentGameScores = gameScores.scores;
    const currentGameProgress = gameScores.scoresProgress;
    const newGameProgress = {};
    for (const tid of Object.keys(currentGameScores)) {
      newGameProgress[tid] = {
        ...currentGameProgress[tid],
        [roundId]: currentGameScores[tid] + (tid === teamId) * points,
      };
    }

    await this.updateTransaction(transaction, {
      [`scores.${teamId}`]: increment(points),
      scoresProgress: newGameProgress,
    });
  }

  // React hooks for real-time operations
  useScores() {
    const { data, loading, error } = super.useDocument();
    return { gameScores: data, loading, error };
  }

  useScoresOnce() {
    const { data, loading, error } = super.useDocumentOnce();
    return { gameScores: data, loading, error };
  }
}
