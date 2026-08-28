import { FieldValue, type Transaction } from 'firebase-admin/firestore';

import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';
import { GameScores, Scores, ScoresProgress } from '@/models/scores';

export default class GameScoreRepository extends FirebaseDocumentRepository {
  constructor(gameId: string) {
    super(['games', gameId, 'realtime', 'scores']);
  }

  async getScoresTransaction(transaction: Transaction): Promise<GameScores | undefined> {
    const data = await this.getTransaction(transaction);
    return data as GameScores | undefined;
  }

  async updateScoresTransaction(transaction: Transaction, scores: Record<string, unknown>): Promise<void> {
    await this.updateTransaction(transaction, scores);
  }

  async setScores(scores: Record<string, unknown>): Promise<void> {
    await this.set(scores);
  }

  async setScoresTransaction(transaction: Transaction, scores: Record<string, unknown>): Promise<void> {
    await this.setTransaction(transaction, scores);
  }

  async initializeScores(): Promise<void> {
    await this.setScores({ gameSortedTeams: [], scores: {}, scoresProgress: {} });
  }

  async initializeScoresTransaction(transaction: Transaction): Promise<void> {
    await this.setScoresTransaction(transaction, { gameSortedTeams: [], scores: {}, scoresProgress: {} });
  }

  async increaseTeamScoreTransaction(
    transaction: Transaction,
    roundId: string,
    teamId: string | null = null,
    points: number = 0
  ): Promise<void> {
    const gameScores = await this.getTransaction(transaction);
    if (!gameScores) return;
    const currentGameScores: Scores = gameScores.scores as Scores;
    const currentGameProgress: ScoresProgress = (gameScores.scoresProgress ?? {}) as ScoresProgress;
    const newGameProgress: ScoresProgress = {};
    for (const tid of Object.keys(currentGameScores)) {
      newGameProgress[tid] = {
        ...(currentGameProgress[tid] || {}),
        [roundId]: currentGameScores[tid] + (tid === teamId ? points : 0),
      };
    }
    await this.updateTransaction(transaction, {
      [`scores.${teamId}`]: FieldValue.increment(points),
      scoresProgress: newGameProgress,
    });
  }
}
