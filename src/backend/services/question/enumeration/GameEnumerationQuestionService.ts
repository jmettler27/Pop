import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import {
  EnumerationChallenger,
  EnumerationQuestion,
  EnumerationQuestionPlayers,
  EnumerationQuestionStatus,
  GameEnumerationQuestion,
  SubmitEnumerationBet,
} from '@/models/questions/enumeration';
import { QuestionType } from '@/models/questions/question-type';
import { EnumerationRound } from '@/models/rounds/enumeration';
import { Scores, ScoresProgress } from '@/models/scores';
import { Player, PlayerStatus } from '@/models/users/player';

export default class GameEnumerationQuestionService extends GameQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.ENUMERATION);

    this.log = logger.child({ module: 'GameEnumerationQuestionService', game: gameId, round: roundId });
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (!playerIds || playerIds.length <= 0) {
      this.log.warn({ question: questionId }, 'Player IDs not found');
      throw new Error('Player IDs not found');
    }

    const gameQuestion = await (this.gameQuestionRepo as GameEnumerationQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    );
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    await (this.gameQuestionRepo as GameEnumerationQuestionRepository).resetQuestionTransaction(
      transaction,
      questionId
    );
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion!.thinkingTime);
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    this.log.info({ question: questionId }, 'Enumeration question reset');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = (await (this.gameQuestionRepo as GameEnumerationQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameEnumerationQuestion;
    const status = gameQuestion.status;
    if (status === EnumerationQuestionStatus.THINKING) {
      this.log.debug({ question: questionId }, 'Enumeration question thinking time ended, moving to challenge phase');
      await this.endThinkingTransaction(transaction, questionId);
    } else if (status === EnumerationQuestionStatus.CHALLENGE) {
      this.log.debug({ question: questionId }, 'Enumeration question challenge time ended, moving to end of question');
      await this.endQuestionTransaction(transaction, questionId);
    }
    this.log.info({ question: questionId }, 'Enumeration question countdown end handled');
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    if (!round) {
      this.log.warn({ question: questionId }, 'Round not found');
      throw new Error('Round not found');
    }
    const enumRound = round as EnumerationRound;

    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScores) {
      this.log.warn({ question: questionId }, 'Round scores not found');
      throw new Error('Round scores not found');
    }

    const questionPlayers = await (this.gameQuestionRepo as GameEnumerationQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    );
    if (!questionPlayers) {
      this.log.warn({ question: questionId }, 'Question players not found');
      throw new Error('Question players not found');
    }

    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores!;
    const challenger: EnumerationChallenger = questionPlayers.challenger as EnumerationChallenger;

    if (!challenger) {
      // We end the question before any bet is submitted
      const teams = await this.teamRepo.getAllTeams();
      if (!teams || teams.length <= 0) {
        this.log.warn({ question: questionId }, 'Teams not found');
        throw new Error('Teams not found');
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
      // Regular case: at least one bet has been submitted
      const { teamId, playerId, numCorrect, bet } = challenger;
      const challengers = await this.playerRepo.getPlayersByTeamId(teamId);
      if (!challengers || challengers.length <= 0) {
        this.log.warn({ question: questionId }, 'Challengers not found');
        throw new Error('Challengers not found');
      }

      const spectators = await this.playerRepo.getAllOtherPlayers(teamId);
      if (!spectators || spectators.length <= 0) {
        this.log.warn({ question: questionId }, 'Spectators not found');
        throw new Error('Spectators not found');
      }

      if (numCorrect < bet) {
        // The challenger did not succeed in its challenge
        const spectatorTeams = await this.teamRepo.getOtherTeams(teamId);
        if (!spectatorTeams || spectatorTeams.length <= 0) {
          this.log.warn({ question: questionId }, 'Spectator teams not found');
          throw new Error('Spectator teams not found');
        }

        const reward = enumRound.rewardsPerQuestion;

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.WRONG,
          challengers.map((c: Player) => c.id!)
        );

        const newRoundScores: Scores = {};
        const newRoundProgress: ScoresProgress = {};
        newRoundScores[teamId] = currRoundScores[teamId] || 0;
        newRoundProgress[teamId] = {
          ...currRoundProgress[teamId],
          [questionId]: currRoundScores[teamId] || 0,
        };

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.CORRECT,
          spectators.map((s: Player) => s.id!)
        );

        for (const spectatorTeam of spectatorTeams) {
          const stid = spectatorTeam.id!;
          newRoundProgress[stid] = {
            ...currRoundProgress[stid],
            [questionId]: currRoundScores[stid] + reward,
          };
          newRoundScores[stid] = currRoundScores[stid] + reward;
        }

        await this.roundScoreRepo.updateScoresTransaction(transaction, {
          scores: newRoundScores,
          scoresProgress: newRoundProgress,
        });
      } else {
        // The challenger succeeded in its challenge
        const reward = enumRound.rewardsPerQuestion + (numCorrect > bet ? enumRound.rewardsForBonus : 0);
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.CORRECT,
          challengers.map((c: Player) => c.id!)
        );
        await (this.gameQuestionRepo as GameEnumerationQuestionRepository).updateQuestionWinnerTransaction(
          transaction,
          questionId,
          playerId,
          teamId
        );
      }
    }

    await super.endQuestionTransaction(transaction, questionId);

    this.log.info({ question: questionId }, 'Enumeration question ended');
  }

  /* =============================================================================================================== */

  async addBet(questionId: string, bet: SubmitEnumerationBet) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!bet.playerId) {
      throw new Error('No player ID has been provided!');
    }
    if (!bet.teamId) {
      throw new Error('No team ID has been provided!');
    }
    if (bet.bet < 0) {
      throw new Error('The bet must be positive!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'pop');
        await (this.gameQuestionRepo as GameEnumerationQuestionRepository).addBetTransaction(
          transaction,
          questionId,
          bet
        );
      });
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to add the bet');
      throw error;
    }
  }

  async endThinking(questionId: string) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    try {
      await runTransaction(firestore, (transaction) => this.endThinkingTransaction(transaction, questionId));
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to end the enum thinking');
      throw error;
    }
  }

  async endThinkingTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = (await (this.gameQuestionRepo as GameEnumerationQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    )) as EnumerationQuestionPlayers;

    /* No player made a bet */
    if (questionPlayers.bets.length === 0) {
      this.log.debug({ question: questionId }, 'No bets submitted for the enumeration question, ending question');
      await this.endQuestionTransaction(transaction, questionId);
    } else {
      this.log.debug(
        { question: questionId, numBets: questionPlayers.bets.length },
        'Bets submitted for the enumeration question, moving to challenge phase'
      );
      const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
        transaction,
        questionId
      )) as EnumerationQuestion;

      // Calculate the 'challenger' of this question (the best player)
      const [playerId, teamId, bet] = GameEnumerationQuestion.findHighestBidder(questionPlayers.bets);
      await (this.gameQuestionRepo as GameEnumerationQuestionRepository).updatePlayersTransaction(
        transaction,
        questionId,
        {
          challenger: {
            playerId,
            teamId,
            bet,
            numCorrect: 0,
            cited: {},
          },
        }
      );

      await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);

      await (this.gameQuestionRepo as GameEnumerationQuestionRepository).updateQuestionTransaction(
        transaction,
        questionId,
        {
          status: EnumerationQuestionStatus.CHALLENGE,
        }
      );

      await this.timerRepo.startTimerTransaction(transaction, baseQuestion.challengeTime);
    }
  }

  async validateItem(questionId: string, itemIdx: number) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (itemIdx < 0) {
      throw new Error('The item index must be positive!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'super_mario_world_coin');
        await (this.gameQuestionRepo as GameEnumerationQuestionRepository).validateItemTransaction(
          transaction,
          questionId,
          itemIdx
        );
        this.log.info({ question: questionId, itemIdx }, 'Item validated');
      });
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to validate the item');
      throw error;
    }
  }

  async incrementValidItems(questionId: string, organizerId: string) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!organizerId) {
      throw new Error('No organizer ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'super_mario_world_coin');
        await (this.gameQuestionRepo as GameEnumerationQuestionRepository).incrementValidItemsTransaction(
          transaction,
          questionId
        );

        this.log.info({ question: questionId, organizer: organizerId }, 'Valid items incremented');
      });
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to increment the valid items');
      throw error;
    }
  }
}
