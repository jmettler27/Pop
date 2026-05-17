import { runTransaction, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import {
  EnumerationChallenger,
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
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const playerIds = await this.playerRepo.getAllPlayerIds();
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    console.log(
      'Enumeration question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const status = gameQuestion.status;
    if (status === EnumerationQuestionStatus.THINKING) {
      await this.endThinkingTransaction(transaction, questionId);
    } else if (status === EnumerationQuestionStatus.CHALLENGE) {
      await this.endQuestionTransaction(transaction, questionId);
    }
    console.log('Enumeration question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    if (!round) {
      console.log();
      throw new Error();
    }
    const enumRound = round as EnumerationRound;

    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    if (!roundScores) {
      console.log();
      throw new Error();
    }

    const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
    if (!questionPlayers) {
      console.log();
      throw new Error();
    }

    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores!;
    const challenger: EnumerationChallenger = questionPlayers.challenger as EnumerationChallenger;

    if (!challenger) {
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
      // Regular case: at least one bet has been submitted
      const { teamId, playerId, numCorrect, bet } = challenger;
      const challengers = await this.playerRepo.getPlayersByTeamId(teamId);
      if (!challengers || challengers.length <= 0) {
        console.log();
        throw new Error();
      }

      const spectators = await this.playerRepo.getAllOtherPlayers(teamId);
      if (!spectators || spectators.length <= 0) {
        console.log();
        throw new Error();
      }

      if (numCorrect < bet) {
        // The challenger did not succeed in its challenge
        const spectatorTeams = await this.teamRepo.getOtherTeams(teamId);
        if (!spectatorTeams || spectatorTeams.length <= 0) {
          console.log();
          throw new Error();
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
        await this.gameQuestionRepo.updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId);
      }
    }

    await super.endQuestionTransaction(transaction, questionId);

    console.log(
      'Enumeration question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
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
        await this.gameQuestionRepo.addBetTransaction(transaction, questionId, bet.playerId, bet.teamId, bet);
      });
    } catch (error) {
      console.error('Failed to add the bet:', error);
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
      console.error('Failed to end the enum thinking:', error);
      throw error;
    }
  }

  async endThinkingTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);

    /* No player made a bet */
    if (questionPlayers.bets.length === 0) {
      await this.endQuestionTransaction(transaction, questionId);
    } else {
      const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);

      // Calculate the 'challenger' of this question (the best player)
      const [playerId, teamId, bet] = GameEnumerationQuestion.findHighestBidder(questionPlayers.bets);
      await this.gameQuestionRepo.updatePlayersTransaction(transaction, questionId, {
        challenger: {
          playerId,
          teamId,
          bet,
          numCorrect: 0,
          cited: {},
        },
      });

      await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);

      await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
        status: EnumerationQuestionStatus.CHALLENGE,
      });

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
        await this.gameQuestionRepo.validateItemTransaction(transaction, questionId, itemIdx);

        console.log('Item validated successfully', questionId, itemIdx);
      });
    } catch (error) {
      console.error('Failed to validate the item:', error);
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
        await this.gameQuestionRepo.incrementValidItemsTransaction(transaction, questionId);

        console.log('Valid items incremented successfully', questionId, organizerId);
      });
    } catch (error) {
      console.error('Failed to increment the valid items:', error);
      throw error;
    }
  }
}
