import { increment, runTransaction, Timestamp } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { EstimationQuestion } from '@/models/questions/Estimation';
import { QuestionType } from '@/models/questions/QuestionType';
import { PlayerStatus } from '@/models/users/Player';

export default class GameEstimationQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.ESTIMATION);
  }

  async resetQuestionTransaction(transaction, questionId) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
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

  async handleCountdownEndTransaction(transaction, questionId) {
    await this.endQuestionTransaction(transaction, questionId);

    console.log('Estimation question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction, questionId) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);

    const bets = gameQuestion.bets || [];
    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;

    if (bets.length === 0) {
      // We end the question before any bet is submitted
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
    bets,
    baseQuestion,
    round,
    currRoundScores,
    currRoundProgress,
    questionId,
    transaction
  ) {
    const answerType = baseQuestion.answerType;
    const parsedAnswer = EstimationQuestion.parseAnswer(answerType, baseQuestion.answer);
    const isDate = answerType === EstimationQuestion.AnswerType.DATE;

    const parse = (str) => EstimationQuestion.parseAnswer(answerType, str);

    const valuesEqual = (a, b) => (isDate ? new Date(a).getTime() === new Date(b).getTime() : a === b);

    const boundSpan = (low, high) =>
      isDate ? Math.abs(new Date(high) - new Date(low)) / 86_400_000 : Math.abs(high - low);

    const rangeContains = (low, high, value) =>
      isDate
        ? new Date(low).getTime() <= new Date(value).getTime() && new Date(value).getTime() <= new Date(high).getTime()
        : low <= value && value <= high;

    // Step 1: exact-value bets — winners are those whose estimation equals the answer
    const winnerTeamIds = new Set();

    for (const bet of bets) {
      if (bet.type !== EstimationQuestion.BetType.EXACT) continue;
      const parsed = parse(bet.estimation);
      if (parsed !== null && valuesEqual(parsed, parsedAnswer)) {
        winnerTeamIds.add(bet.teamId);
      }
    }

    // Step 3: if no exact winner, fall back to range bets
    if (winnerTeamIds.size === 0) {
      const validRangeBets = bets.filter((bet) => {
        if (bet.type !== EstimationQuestion.BetType.RANGE) return false;
        const low = parse(bet.lower);
        const high = parse(bet.upper);
        return low !== null && high !== null && rangeContains(low, high, parsedAnswer);
      });

      if (validRangeBets.length > 0) {
        let minSpan = Infinity;
        for (const bet of validRangeBets) {
          const s = boundSpan(parse(bet.lower), parse(bet.upper));
          if (s < minSpan) minSpan = s;
        }
        for (const bet of validRangeBets) {
          if (boundSpan(parse(bet.lower), parse(bet.upper)) === minSpan) {
            winnerTeamIds.add(bet.teamId);
          }
        }
      }
    }

    await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, Array.from(winnerTeamIds));

    // Step 4: update round scores and progress for all teams
    const scoreUpdates = {};
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
      const playerIds = players.filter((p) => p.teamId === tid).map((p) => p.id);
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

  async submitBet(questionId, playerId, teamId, bet) {
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

  async submitBetTransaction(transaction, questionId, playerId, teamId, bet) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const numTeams = await this.teamRepo.getNumTeams(transaction);

    const teamAlreadySubmitted = gameQuestion.bets && gameQuestion.bets.some((b) => b.teamId === teamId);
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
      const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
      const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
      const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
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
