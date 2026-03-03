import GameQuestionService from '@/backend/services/question/GameQuestionService';

import { runTransaction } from 'firebase/firestore';

import { TimerStatus } from '@/backend/models/Timer';
import { PlayerStatus } from '@/backend/models/users/Player';
import { EnumerationQuestionStatus, GameEnumerationQuestion } from '@/backend/models/questions/Enumeration';
import { firestore } from '@/backend/firebase/firebase';
import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameEnumerationQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.ENUMERATION);
  }

  async resetQuestionTransaction(transaction, questionId) {
    const playerIds = await this.playerRepo.getAllPlayerIds();

    await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction);
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

  async handleCountdownEndTransaction(transaction, questionId) {
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
    const status = gameQuestion.status;
    if (status === EnumerationQuestionStatus.REFLECTION) {
      await this.endReflectionTransaction(transaction, questionId);
    } else if (status === EnumerationQuestionStatus.CHALLENGE) {
      await this.endQuestionTransaction(transaction, questionId);
    }
    console.log('Enumeration question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction, questionId) {
    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    const roundScores = await this.roundScoreRepo.getScoresTransaction(transaction);
    const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);

    const { scores: currRoundScores, scoresProgress: currRoundProgress } = roundScores;
    const { challenger } = questionPlayers;

    if (!challenger) {
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
      // Regular case: at least one bet has been submitted
      const { teamId, playerId, numCorrect, bet } = challenger;
      const challengers = await this.playerRepo.getPlayersByTeamId(teamId);
      const spectators = await this.playerRepo.getAllOtherPlayers(teamId);

      if (numCorrect < bet) {
        // The challenger did not succeed in its challenge
        const spectatorTeams = await this.teamRepo.getOtherTeams(teamId);
        const reward = round.rewardsPerQuestion;

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.WRONG,
          challengers.map((c) => c.id)
        );

        const newRoundScores = {};
        const newRoundProgress = {};
        newRoundScores[teamId] = currRoundScores[teamId] || 0;
        newRoundProgress[teamId] = {
          ...currRoundProgress[teamId],
          [questionId]: currRoundScores[teamId] || 0,
        };

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.CORRECT,
          spectators.map((s) => s.id)
        );

        for (const spectatorTeam of spectatorTeams) {
          const stid = spectatorTeam.id;
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
        const reward = round.rewardsPerQuestion + (numCorrect > bet) * round.rewardsForBonus;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, reward);

        await this.playerRepo.updateAllPlayersStatusTransaction(
          transaction,
          PlayerStatus.CORRECT,
          challengers.map((c) => c.id)
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

  async addBet(questionId, playerId, teamId, bet) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    if (!teamId) {
      throw new Error('No team ID has been provided!');
    }
    if (bet < 0) {
      throw new Error('The bet must be positive!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'pop');
        await this.gameQuestionRepo.addBetTransaction(transaction, questionId, playerId, teamId, bet);
      });
    } catch (error) {
      console.error('Failed to add the bet:', error);
      throw error;
    }
  }

  async endReflection(questionId) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    try {
      await runTransaction(firestore, (transaction) => this.endReflectionTransaction(transaction, questionId));
    } catch (error) {
      console.error('Failed to end the enum reflection:', error);
      throw error;
    }
  }

  async endReflectionTransaction(transaction, questionId) {
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

      await this.timerRepo.updateTimerTransaction(transaction, {
        duration: baseQuestion.challengeTime,
        status: TimerStatus.RESET,
      });
    }
  }

  async validateItem(questionId, itemIdx) {
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

  async incrementValidItems(questionId, organizerId) {
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
