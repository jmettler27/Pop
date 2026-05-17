import { increment, runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { QuestionType } from '@/models/questions/question-type';
import { GameReorderingQuestion, Ordering, ReorderingQuestion, SubmittedOrdering } from '@/models/questions/reordering';
import { ReorderingRound } from '@/models/rounds/reordering';
import { RoundScores, Scores, ScoresProgress } from '@/models/scores';
import { PlayerStatus } from '@/models/users/player';

export default class GameReorderingQuestionService extends GameQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.REORDERING);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

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

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    await this.endQuestionTransaction(transaction, questionId);

    console.log('Reordering question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!baseQuestion) {
      console.log();
      throw new Error();
    }

    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      console.log();
      throw new Error();
    }

    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    if (!round) {
      console.log();
      throw new Error();
    }
    const reorderingRound = round as ReorderingRound;

    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScores) {
      console.log();
      throw new Error();
    }

    const maxScore = baseQuestion.items.length;
    const orderings = gameQuestion.orderings || [];
    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

    if (orderings.length === 0) {
      // We end the question before any ordering is submitted
      const teams = await this.teamRepo.getAllTeams();

      const newRoundScores: Scores = {};
      const newRoundProgress: ScoresProgress = {};
      for (const team of teams) {
        const teamId = team.id!;
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
    } else {
      // Regular case: at least one ordering has been submitted, calculate scores as normal
      await this.calculateRewardsAndProgressTransaction(
        orderings,
        reorderingRound,
        currRoundScores,
        currRoundProgress,
        questionId,
        transaction,
        maxScore
      );
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

  async calculateRewardsAndProgressTransaction(
    orderings: Ordering[],
    round: ReorderingRound,
    currRoundScores: Scores,
    currRoundProgress: ScoresProgress,
    questionId: string,
    transaction: Transaction,
    maxScore: number
  ) {
    const players = await this.playerRepo.getAllPlayers();

    // Build a map of teamId -> reward for this question
    const teamRewards: Scores = {};
    for (const submission of orderings) {
      const { teamId, score } = submission;
      teamRewards[teamId] = score * round.rewardsPerElement;
    }

    // Build the new round progress for ALL teams (not just those who submitted)
    const newRoundProgress: ScoresProgress = {};
    for (const tid of Object.keys(currRoundScores)) {
      const reward = teamRewards[tid] || 0;
      newRoundProgress[tid] = {
        ...currRoundProgress[tid],
        [questionId]: currRoundScores[tid] + reward,
      };
    }

    // Build score increments using Firestore increment
    const scoreUpdates: Record<string, unknown> = {};
    for (const tid of Object.keys(newRoundProgress)) {
      scoreUpdates[`scoresProgress.${tid}`] = newRoundProgress[tid];
    }
    for (const [teamId, reward] of Object.entries(teamRewards)) {
      if (reward > 0) {
        scoreUpdates[`scores.${teamId}`] = increment(reward);
      }
    }

    // Write phase: update all player statuses
    for (const submission of orderings) {
      const { teamId, score } = submission;
      const playerIds = players.filter((p) => p.teamId === teamId).map((p) => p.id!);
      await this.playerRepo.updateAllPlayersStatusTransaction(
        transaction,
        score === maxScore ? PlayerStatus.CORRECT : PlayerStatus.WRONG,
        playerIds
      );
    }

    // Write phase: update all scores in a single call
    await this.roundScoreRepo.updateScoresTransaction(transaction, scoreUpdates);
  }

  /* =============================================================================================================== */

  async submitOrdering(
    questionId: string,
    playerId: string,
    teamId: string,
    ordering: SubmittedOrdering
  ): Promise<void> {
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

  async submitOrderingTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    teamId: string,
    ordering: SubmittedOrdering
  ) {
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameReorderingQuestion;
    if (!gameQuestion) {
      throw new Error('Game question not found');
    }

    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as ReorderingQuestion;
    if (!baseQuestion) {
      throw new Error('Base question not found');
    }

    const numTeams = await this.teamRepo.getNumTeams();
    if (!numTeams) {
      throw new Error('No teams found');
    }

    // Check if team has already submitted
    const teamAlreadySubmitted =
      gameQuestion.orderings && gameQuestion.orderings.some((o: Ordering) => o.teamId === teamId);
    if (teamAlreadySubmitted) {
      throw new Error('Your team has already submitted an ordering!');
    }

    // Validate ordering length matches items
    if (ordering.length !== baseQuestion.items!.length) {
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

    // Check if all teams have submitted
    if (orderings.length >= numTeams) {
      const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as ReorderingRound;
      if (!round) {
        throw new Error('Round not found');
      }

      const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
      if (!roundScores) {
        throw new Error('Round scores not found');
      }

      const maxScore = baseQuestion.items!.length;
      const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

      // All teams have submitted, end the question
      await this.calculateRewardsAndProgressTransaction(
        orderings,
        round,
        currRoundScores,
        currRoundProgress,
        questionId,
        transaction,
        maxScore
      );
      await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
        orderings,
      });
      await super.endQuestionTransaction(transaction, questionId);
    } else {
      await this.gameQuestionRepo.updateTransaction(transaction, questionId, {
        orderings,
      });
    }

    console.log('Reordering submitted successfully', 'questionId', questionId, 'teamId', teamId, 'score', score);
  }
}
