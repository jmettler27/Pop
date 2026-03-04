import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { runTransaction, Timestamp, increment } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';
import { PlayerStatus } from '@/backend/models/users/Player';

export default class GameReorderingQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.REORDERING);
  }

  async resetQuestionTransaction(transaction, questionId) {
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);

    console.log(
      'Reordering question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    await this.endQuestionTransaction(transaction, questionId);

    console.log('Reordering question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction, questionId) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);

    const maxScore = baseQuestion.items.length;
    const orderings = gameQuestion.orderings || [];
    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

    if (orderings.length === 0) {
      // We end the question before any ordering is submitted
      const teams = await this.teamRepo.getAllTeams();

      const newRoundScores = {};
      const newRoundProgress = {};
      for (const team of teams) {
        const teamId = team.id;
        newRoundScores[teamId] = currRoundScores[teamId] || 0;
        newRoundProgress[teamId] = {
          ...currRoundProgress[teamId],
          [questionId]: currRoundScores[teamId] || 0,
        };
      }

      await this.roundScoreRepo.updateScoresTransaction(transaction, {
        scores: newRoundScores,
        scoresProgress: newRoundProgress,
      });
      return;
    } else {
      // Regular case: at least one ordering has been submitted, calculate scores as normal
      const players = await this.playerRepo.getAllPlayers();

      // Build a map of teamId -> reward for this question
      const teamRewards = {};
      for (const submission of orderings) {
        const { teamId, score } = submission;
        teamRewards[teamId] = score * round.rewardsPerElement;
      }

      // Build the new round progress for ALL teams (not just those who submitted)
      const newRoundProgress = {};
      for (const tid of Object.keys(currRoundScores)) {
        const reward = teamRewards[tid] || 0;
        newRoundProgress[tid] = {
          ...currRoundProgress[tid],
          [questionId]: currRoundScores[tid] + reward,
        };
      }

      // Build score increments using Firestore increment
      const scoreUpdates = { scoresProgress: newRoundProgress };
      for (const [teamId, reward] of Object.entries(teamRewards)) {
        if (reward > 0) {
          scoreUpdates[`scores.${teamId}`] = increment(reward);
        }
      }

      // Write phase: update all player statuses
      for (const submission of orderings) {
        const { teamId, score } = submission;
        const playerIds = players.filter((p) => p.teamId === teamId).map((p) => p.id);
        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          score === maxScore ? PlayerStatus.CORRECT : PlayerStatus.WRONG,
          playerIds
        );
      }

      // Write phase: update all scores in a single call
      await this.roundScoreRepo.updateScoresTransaction(transaction, scoreUpdates);
    }

    await super.endQuestionTransaction(transaction, questionId);

    console.log(
      'Reordering question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  /* =============================================================================================================== */

  async submitOrdering(questionId, playerId, teamId, ordering) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }

    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }

    if (!ordering) {
      throw new Error('No ordering has been provided!');
    }

    if (!Array.isArray(ordering)) {
      throw new Error('Ordering must be an array');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.submitOrderingTransaction(transaction, questionId, playerId, teamId, ordering);
      });
    } catch (error) {
      console.error('Failed to submit the ordering:', error);
      throw error;
    }
  }

  async submitOrderingTransaction(transaction, questionId, playerId, teamId, ordering) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);

    // Check if team has already submitted
    const teamAlreadySubmitted = gameQuestion.orderings && gameQuestion.orderings.some((o) => o.teamId === teamId);
    if (teamAlreadySubmitted) {
      throw new Error('Your team has already submitted an ordering!');
    }

    // Validate ordering length matches items
    if (ordering.length !== baseQuestion.items.length) {
      throw new Error('Ordering length does not match items length');
    }

    // Calculate score: number of items in correct position
    let score = 0;
    for (let i = 0; i < ordering.length; i++) {
      if (ordering[i] === i) {
        score++;
      }
    }

    // Add submission to orderings array
    const newOrdering = {
      teamId,
      ordering,
      score,
      playerId,
      submittedAt: Timestamp.now(),
    };

    const orderings = gameQuestion.orderings || [];
    orderings.push(newOrdering);

    // Update game question with new ordering
    await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
      orderings,
    });

    // Check if all teams have submitted
    const numTeams = await this.teamRepo.getNumTeams(transaction);
    if (orderings.length >= numTeams) {
      // All teams have submitted, end the question
      await this.endQuestionTransaction(transaction, questionId);
    }

    console.log('Reordering submitted successfully', 'questionId', questionId, 'teamId', teamId, 'score', score);
  }
}
