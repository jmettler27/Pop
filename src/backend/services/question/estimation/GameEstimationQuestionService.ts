import { increment, runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import {
  EstimationBet,
  EstimationQuestion,
  GameEstimationQuestion,
  isExactEstimationBet,
  isRangeEstimationBet,
  RangeEstimationBet,
} from '@/models/questions/estimation';
import { QuestionType } from '@/models/questions/question-type';
import { EstimationRound } from '@/models/rounds/estimation';
import { RoundScores, Scores, ScoresProgress } from '@/models/scores';
import { PlayerStatus } from '@/models/users/player';

export default class GameEstimationQuestionService extends GameQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ESTIMATION);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameEstimationQuestion;
    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    console.log(
      'Estimation question successfully reset',
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

    console.log('Estimation question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as EstimationQuestion;
    if (!baseQuestion) {
      throw new Error('Question not found');
    }

    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameEstimationQuestion;
    if (!gameQuestion) {
      throw new Error('Game question not found');
    }
    const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as EstimationRound;
    if (!round) {
      throw new Error('Round not found');
    }

    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScores) {
      throw new Error('Round scores not found');
    }

    const bets = gameQuestion.bets || [];
    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

    if (bets.length === 0) {
      // We end the question before any bet is submitted
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
      await this.calculateRewardsAndProgressTransaction(
        bets,
        baseQuestion,
        round,
        currRoundScores,
        currRoundProgress,
        questionId,
        transaction
      );
    }

    await super.endQuestionTransaction(transaction, questionId);

    console.log(
      'Estimation question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async calculateRewardsAndProgressTransaction(
    bets: EstimationBet[],
    baseQuestion: EstimationQuestion,
    round: EstimationRound,
    currRoundScores: Scores,
    currRoundProgress: ScoresProgress,
    questionId: string,
    transaction: Transaction
  ) {
    const answerType = baseQuestion.answerType;
    const parsedAnswer = EstimationQuestion.parseAnswer(answerType, baseQuestion.answer);
    const isDate = answerType === EstimationQuestion.AnswerType.DATE;

    const parse = (str: string) => EstimationQuestion.parseAnswer(answerType, str);

    const valuesEqual = (a: number | string, b: number | string) =>
      isDate ? new Date(a).getTime() === new Date(b).getTime() : a === b;

    const boundSpan = (low: number | string, high: number | string) =>
      isDate
        ? Math.abs(new Date(high).getTime() - new Date(low).getTime()) / 86_400_000
        : Math.abs((high as number) - (low as number));

    const rangeContains = (low: any, high: any, value: any) =>
      isDate
        ? new Date(low).getTime() <= new Date(value).getTime() && new Date(value).getTime() <= new Date(high).getTime()
        : low <= value && value <= high;

    // Step 1: exact-value bets — winners are those whose estimation equals the answer
    const winnerTeamIds = new Set();

    for (const bet of bets) {
      if (!isExactEstimationBet(bet)) continue;
      const parsed = parse(bet.estimation);
      if (parsed !== null && valuesEqual(parsed, parsedAnswer!)) {
        winnerTeamIds.add(bet.teamId);
      }
    }

    // Step 3: if no exact winner, fall back to range bets
    if (winnerTeamIds.size === 0) {
      const validRangeBets: RangeEstimationBet[] = bets
        .filter((bet) => {
          if (!isRangeEstimationBet(bet)) return false;
          const low = parse(bet.lower);
          const high = parse(bet.upper);
          return low !== null && high !== null && rangeContains(low, high, parsedAnswer);
        })
        .map((bet) => bet as RangeEstimationBet);

      if (validRangeBets.length > 0) {
        let minSpan = Infinity;
        for (const bet of validRangeBets) {
          if (!isRangeEstimationBet(bet)) continue;
          const lowerParsed = parse(bet.lower);
          const upperParsed = parse(bet.upper);
          const s = boundSpan(lowerParsed!, upperParsed!);
          if (s < minSpan) minSpan = s;
        }
        for (const bet of validRangeBets) {
          if (!isRangeEstimationBet(bet)) continue;
          const lowerParsed = parse(bet.lower);
          const upperParsed = parse(bet.upper);
          if (boundSpan(lowerParsed!, upperParsed!) === minSpan) {
            winnerTeamIds.add(bet.teamId);
          }
        }
      }
    }

    await this.gameQuestionRepo.updateQuestionWinnersTransaction(transaction, questionId, Array.from(winnerTeamIds));

    // Step 4: update round scores and progress for all teams
    const scoreUpdates: Record<string, unknown> = {};
    for (const tid of Object.keys(currRoundScores)) {
      const isWinner = winnerTeamIds.has(tid);
      scoreUpdates[`scoresProgress.${tid}`] = {
        ...currRoundProgress[tid],
        [questionId]: (currRoundScores[tid] || 0) + (isWinner ? round.rewardsPerQuestion : 0),
      };
      if (isWinner) {
        scoreUpdates[`scores.${tid}`] = increment(round.rewardsPerQuestion);
      }
    }
    await this.roundScoreRepo.updateScoresTransaction(transaction, scoreUpdates);

    // Step 5: update player statuses
    const players = await this.playerRepo.getAllPlayers();
    for (const tid of Object.keys(currRoundScores)) {
      const playerIds = players.filter((p) => p.teamId === tid).map((p) => p.id!);
      if (playerIds.length > 0) {
        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          winnerTeamIds.has(tid) ? PlayerStatus.CORRECT : PlayerStatus.WRONG,
          playerIds
        );
      }
    }
  }

  /* =============================================================================================================== */

  async submitBet(questionId: string, playerId: string, teamId: string, bet: EstimationBet) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }

    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }

    if (!bet) {
      throw new Error('No bet has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.submitBetTransaction(transaction, questionId, playerId, teamId, bet);
      });
    } catch (error) {
      console.error('Failed to submit the bet:', error);
      throw error;
    }
  }

  async submitBetTransaction(
    transaction: Transaction,
    questionId: string,
    playerId: string,
    teamId: string,
    bet: EstimationBet
  ) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    if (!gameQuestion) {
      throw new Error('Game question not found');
    }

    const numTeams = await this.teamRepo.getNumTeams();
    if (!numTeams) {
      throw new Error('No teams found');
    }

    const teamAlreadySubmitted = gameQuestion.bets && gameQuestion.bets.some((b: EstimationBet) => b.teamId === teamId);
    if (teamAlreadySubmitted) {
      throw new Error('Your team has already submitted a bet!');
    }

    // Spread bet fields (type, estimation / lower+upper) at the top level alongside identity fields
    const newBet = {
      ...bet,
      teamId,
      playerId,
      submittedAt: Timestamp.now(),
    };

    const bets = gameQuestion.bets || [];
    bets.push(newBet);

    if (bets.length >= numTeams) {
      // All teams have submitted their bets => we can end the question
      const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
        transaction,
        questionId
      )) as EstimationQuestion;
      if (!baseQuestion) {
        throw new Error('Question not found');
      }

      const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as EstimationRound;
      if (!round) {
        throw new Error('Round not found');
      }

      const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
      if (!roundScores) {
        throw new Error('Round scores not found');
      }

      const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

      await this.calculateRewardsAndProgressTransaction(
        bets,
        baseQuestion,
        round,
        currRoundScores,
        currRoundProgress,
        questionId,
        transaction
      );
      await this.gameQuestionRepo.updateTransaction(transaction, questionId, { bets });
      await super.endQuestionTransaction(transaction, questionId);
    } else {
      // Not all teams have submitted yet => just update the bets for now
      await this.gameQuestionRepo.updateTransaction(transaction, questionId, { bets });
    }

    console.log('Estimation bet submitted successfully', 'questionId', questionId, 'teamId', teamId);
  }
}
