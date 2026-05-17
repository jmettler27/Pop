import { runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { range } from '@/backend/utils/arrays';
import { isObjectEmpty } from '@/backend/utils/objects';
import { QuestionType } from '@/models/questions/question-type';
import { LabellingRound } from '@/models/rounds/labelling';
import { PlayerStatus } from '@/models/users/player';

export default class GameLabellingQuestionService extends GameBuzzerQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
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

    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (!playerIds) {
      console.log();
      throw new Error();
    }

    await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      revealed: baseQuestion.getInitialRevealed(),
    });

    await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE, playerIds);

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

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

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
    const { buzzed } = questionPlayers.buzzed;
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    if (buzzed.length === 0) {
      await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    } else {
      await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, buzzed[0]);

      if (buzzed.length > 1) {
        await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime);
      } else {
        await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime);
      }
    }

    console.log(
      'Labelling question countdown end successfully handled',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  /* =============================================================================================================== */

  /**
   * When the organizer reveals a label.
   */
  async revealLabel(questionId: string, labelIdx: number) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    try {
      // transaction
      await runTransaction(firestore, async (transaction) => {
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
        const labellingRound = round as LabellingRound;

        const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
        if (!questionPlayers) {
          console.log();
          throw new Error();
        }
        const playerId = questionPlayers.buzzed[0] || null;

        const newRevealed = gameQuestion.revealed;
        newRevealed[labelIdx] = {
          revealedAt: Timestamp.now(),
          playerId,
        };

        /* Update the winner team scores */
        if (playerId) {
          const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
          if (!player) {
            console.log();
            throw new Error();
          }

          await this.roundScoreRepo.increaseTeamScoreTransaction(
            transaction,
            questionId,
            player.teamId,
            labellingRound.rewardsPerElement
          );
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        }

        const labels = baseQuestion.labels;

        const allRevealed = range(labels.length).every((index) => {
          return newRevealed[index] && !isObjectEmpty(newRevealed[index]);
        });

        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);

        // If all revealed
        if (allRevealed) {
          await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
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

  async validateAllLabels(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
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
        const labellingRound = round as LabellingRound;

        const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
        if (!player) {
          console.log();
          throw new Error();
        }

        const newRevealed = gameQuestion.revealed;
        newRevealed.fill({
          revealedAt: Timestamp.now(),
          playerId,
        });

        /* Update the winner team scores */
        const multiplier = baseQuestion.labels.length;
        const points = labellingRound.rewardsPerElement * multiplier;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, player.teamId, points);

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);

        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);

        await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
        await this.endQuestionTransaction(transaction, questionId);

        console.log('Labelling question all labels validated successfully', questionId);
      });
    } catch (error) {
      console.error('Failed to validate all labels', error);
      throw error;
    }
  }

  async cancelPlayer(questionId: string, playerId: string) {
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
