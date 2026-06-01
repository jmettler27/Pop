import { increment, runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { QuestionType } from '@/models/questions/question-type';
import { GameReorderingQuestion, Ordering, ReorderingQuestion, SubmittedOrdering } from '@/models/questions/reordering';
import { ReorderingRound } from '@/models/rounds/reordering';
import { Scores, ScoresProgress } from '@/models/scores';
import { PlayerStatus } from '@/models/users/player';

export default class GameReorderingQuestionService extends GameQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.REORDERING);
    this.log = logger.child({ module: 'GameReorderingQuestionService', game: gameId, round: roundId });
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameReorderingQuestion;
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    this.log.info({ question: questionId }, 'Reordering question reset');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    await this.endQuestionTransaction(transaction, questionId);

    this.log.info({ question: questionId }, 'Reordering question countdown end handled');
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as ReorderingQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameReorderingQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as ReorderingRound;
    if (!round) {
      this.log.warn({ question: questionId }, 'Round not found');
      throw new Error('Round not found');
    }

    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScores) {
      this.log.warn({ question: questionId }, 'Round scores not found');
      throw new Error('Round scores not found');
    }

    const maxScore = baseQuestion.items!.length;
    const orderings = gameQuestion.orderings || [];
    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

    if (orderings.length === 0) {
      this.log.debug(
        { question: questionId },
        'No orderings submitted for this question, skipping rewards calculation'
      );
      // We end the question before any ordering is submitted
      const teams = await this.teamRepo.getAllTeams();
      if (!teams) {
        this.log.warn({ question: questionId }, 'No teams found when ending question');
        throw new Error('No teams found when ending question');
      }

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
      this.log.debug({ question: questionId }, 'Calculating rewards for submitted orderings');
      // Regular case: at least one ordering has been submitted, calculate scores as normal
      await this.calculateRewardsAndProgressTransaction(
        orderings,
        round,
        currRoundScores,
        currRoundProgress,
        questionId,
        transaction,
        maxScore
      );
    }

    await super.endQuestionTransaction(transaction, questionId);

    this.log.info({ question: questionId }, 'Reordering question ended');
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
    if (!players) {
      this.log.warn({ question: questionId }, 'No players found when calculating rewards');
      throw new Error('No players found when calculating rewards');
    }

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
      this.log.error({ question: questionId, err: error }, 'Failed to submit the ordering');
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
      this.log.warn({ question: questionId }, 'Game question not found when submitting ordering');
      throw new Error('Game question not found');
    }

    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as ReorderingQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found when submitting ordering');
      throw new Error('Base question not found');
    }

    const numTeams = await this.teamRepo.getNumTeams();
    const orderings = gameQuestion.orderings || [];

    // Check if team has already submitted
    const teamAlreadySubmitted = orderings.some((o: Ordering) => o.teamId === teamId);
    if (teamAlreadySubmitted) {
      this.log.warn({ question: questionId, team: teamId }, 'Team has already submitted an ordering');
      throw new Error('Your team has already submitted an ordering!');
    }

    // Validate ordering length matches items
    if (ordering.length !== baseQuestion.items!.length) {
      this.log.warn({ question: questionId }, 'Ordering length does not match items length');
      throw new Error('Ordering length does not match items length');
    }

    // Score = number of items in correct position
    const score = ordering.filter((item: number, i: number) => item === i).length;

    // Add submission to orderings array
    const newOrdering = {
      teamId,
      ordering,
      score,
      playerId,
      submittedAt: Timestamp.now(),
    };

    orderings.push(newOrdering);

    // Check if all teams have submitted
    if (orderings.length >= numTeams) {
      const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as ReorderingRound;
      if (!round) {
        this.log.warn({ question: questionId }, 'Round not found');
        throw new Error('Round not found');
      }

      const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
      if (!roundScores) {
        this.log.warn({ question: questionId }, 'Round scores not found');
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
      await this.gameQuestionRepo.updateTransaction(transaction, questionId, { orderings });
      await super.endQuestionTransaction(transaction, questionId);
    } else {
      await this.gameQuestionRepo.updateTransaction(transaction, questionId, { orderings });
    }

    this.log.info({ question: questionId, team: teamId, score }, 'Reordering submitted');
  }
}
