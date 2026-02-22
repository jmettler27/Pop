import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { increment } from 'firebase/firestore';

export default class ScoreRepository extends FirebaseDocumentRepository {
  constructor(documentPath) {
    super(documentPath);
  }

  async getScoresTransaction(transaction) {
    return await this.getTransaction(transaction);
  }

  async updateScoresTransaction(transaction, scores) {
    await this.updateTransaction(transaction, scores);
  }

  async setScoresTransaction(transaction, scores) {
    await this.setTransaction(transaction, scores);
  }

  async initializeScoresTransaction(transaction, data) {
    await this.setScoresTransaction(transaction, data);
  }

  async increaseTeamScoreTransaction(transaction, roundId, teamId = null, points = 0) {
    const scores = await this.getTransaction(transaction);
    const { scores: currentScores, scoresProgress: currentProgress } = scores;

    const newProgress = {};
    for (const tid of Object.keys(currentProgress)) {
      newProgress[tid] = {
        ...currentProgress[tid],
        [roundId]: currentScores[tid] + (tid === teamId) * points,
      };
    }

    await this.updateTransaction(transaction, {
      [`scores.${teamId}`]: increment(points),
      scoresProgress: newProgress,
    });
  }

  // React hooks for real-time operations
  useScores() {
    const { data, loading, error } = super.useDocument();
    return { data, loading, error };
  }

  useScoresOnce() {
    const { data, loading, error } = super.useDocumentOnce();
    return { scores: data, loading, error };
  }
}
