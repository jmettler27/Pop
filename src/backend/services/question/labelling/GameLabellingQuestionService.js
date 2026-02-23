import GameQuestionService from '@/backend/services/question/GameQuestionService';

import { firestore } from '@/backend/firebase/firebase';
import { runTransaction, Timestamp } from 'firebase/firestore';

import { isObjectEmpty } from '@/backend/utils/objects';
import { range } from '@/backend/utils/arrays';

import { PlayerStatus } from '@/backend/models/users/Player';
import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameLabellingQuestionService extends GameQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  async resetQuestionTransaction(transaction, questionId) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const playerIds = await this.playerRepo.getAllPlayerIds();

    await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      revealed: baseQuestion.getInitialRevealed(),
    });

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    console.log(
      'Labelling question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction, questionId) {
    const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
    const buzzed = players.buzzed;

    if (buzzed.length === 0) await this.timerRepo.resetTimerTransaction(transaction);
    else await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, buzzed[0]);

    console.log('Labelling question countdown end successfully handled', questionId);
  }

  async endQuestionTransaction(transaction, questionId) {
    await super.endQuestionTransaction(transaction, questionId);

    console.log('Labelling question successfully ended', 'game', gameId, questionId);
  }

  /* =============================================================================================================== */

  /**
   * When the organizer reveals a label.
   */
  async revealLabel(questionId, labelIdx) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    try {
      // transaction
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);

        const playerId = questionPlayers.buzzed[0] || null;

        const newRevealed = gameQuestion.revealed;
        newRevealed[labelIdx] = {
          revealedAt: Timestamp.now(),
          playerId,
        };

        /* Update the winner team scores */
        if (playerId) {
          const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
          await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, player.teamId, round.rewardsPerElement);
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        }

        const labels = baseQuestion.labels;

        const allRevealed = range(labels.length).every((index) => {
          return newRevealed[index] && !isObjectEmpty(newRevealed[index]);
        });

        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);

        // If all revealed
        if (allRevealed) {
          await this.soundRepo.addSoundTransaction(transaction, 'Anime wow');
          await this.endQuestionTransaction(transaction, questionId);
          return;
        }
        await this.soundRepo.addSoundTransaction(
          transaction,
          playerId ? 'super_mario_world_coin' : 'cartoon_mystery_musical_tone_002'
        );

        console.log('Labelling question label revealed successfully', questionId, labelIdx);
      });
    } catch (error) {
      console.error('Failed to reveal the label', error);
      throw error;
    }
  }

  async validateAllLabels(questionId, playerId) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);

        const newRevealed = gameQuestion.revealed;
        newRevealed.fill({
          revealedAt: Timestamp.now(),
          playerId,
        });

        /* Update the winner team scores */
        const multiplier = baseQuestion.labels.length;
        const points = round.rewardsPerElement * multiplier;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, player.teamId, points);

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);

        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);

        await this.soundRepo.addSoundTransaction(transaction, 'Anime wow');
        await this.endQuestionTransaction(transaction, questionId);

        console.log('Labelling question all labels validated successfully', questionId);
      });
    } catch (error) {
      console.error('Failed to validate all labels', error);
      throw error;
    }
  }

  async cancelPlayer(questionId, playerId) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, playerId);
        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
        await this.soundRepo.addSoundTransaction(transaction, 'cartoon_mystery_musical_tone_002');
        await this.timerRepo.resetTimerTransaction(transaction);

        console.log('Labelling player canceled successfully', questionId, playerId);
      });
    } catch (error) {
      console.error('Failed to cancel the player', error);
      throw error;
    }
  }
}
