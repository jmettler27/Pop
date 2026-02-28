import { firestore } from '@/backend/firebase/firebase';
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, runTransaction } from 'firebase/firestore';

import Game from '@/backend/models/games/Game';

import { getDocDataTransaction } from '@/backend/services/utils';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';

export default class ScoreService {
  constructor(gameId) {
    this.gameScoreRepo = new GameScoreRepository(gameId);
    this.teamRepo = new TeamRepository(gameId);
  }

  async initRoundScores(gameId, roundId) {
    const initTeamRoundScores = await this.getInitTeamScores(gameId);
    await this.updateRoundScores(gameId, roundId, {
      scores: initTeamRoundScores,
      scoresProgress: {},
      teamsScoresSequences: {},
      roundSortedTeams: [],
      gameSortedTeams: [],
    });
  }

  async increaseRoundTeamScore(gameId, roundId, questionId, teamId, points) {
    if (!gameId) {
      throw new Error('Missing required parameters');
    }
    if (!roundId) {
      throw new Error('Missing required parameters');
    }
    if (!questionId) {
      throw new Error('Missing required parameters');
    }
    if (!teamId) {
      throw new Error('Missing required parameters');
    }

    try {
      await runTransaction(firestore, (transaction) =>
        this.increaseTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)
      );
    } catch (error) {
      console.error('Error increasing team score:', error);
      throw error;
    }
  }

  // async increaseTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points) {
  //   const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');
  //   const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef);
  //
  //   const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScoresData;
  //
  //   // Update progress for all teams
  //   const newRoundProgress = {};
  //   for (const tid of Object.keys(currRoundScores)) {
  //     newRoundProgress[tid] = {
  //       ...currRoundProgress[tid],
  //       [questionId]: currRoundScores[tid] + (tid === teamId) * points,
  //     };
  //   }
  //
  //   // Update scores
  //   transaction.update(roundScoresRef, {
  //     [`scores.${teamId}`]: increment(points),
  //     scoresProgress: newRoundProgress,
  //   });
  // }

  // async getInitTeamScores() {
  //   const teams = await this.teamRepo.getAllTeams();
  //   return Object.fromEntries(teams.map((t) => [t.id, 0]));
  // }

  async updateRoundScores(gameId, roundId, scoresData) {
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');
    await runTransaction(firestore, (transaction) => {
      transaction.set(roundScoresRef, scoresData);
    });
  }

  async calculateRoundCompletionRates(gameId, roundId) {
    const gameRef = doc(GAMES_COLLECTION_REF, gameId);
    const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');

    const [gameData, roundData, roundScoresData] = await Promise.all([
      getDocDataTransaction(null, gameRef),
      getDocDataTransaction(null, roundRef),
      getDocDataTransaction(null, roundScoresRef),
    ]);

    const game = new Game(gameData);
    const round = game.getCurrentRound();
    const { scores: roundScores } = roundScoresData;

    // Calculate completion rates based on round type
    const completionRates = {};
    const maxPoints = round.getMaxPoints();

    Object.entries(roundScores).forEach(([teamId, score]) => {
      completionRates[teamId] = maxPoints > 0 ? Math.round((100 * score) / maxPoints) : 0;
    });

    return completionRates;
  }
}
