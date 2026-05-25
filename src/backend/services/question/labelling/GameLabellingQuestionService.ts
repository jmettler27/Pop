import { runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { range } from '@/backend/utils/arrays';
import { isObjectEmpty } from '@/backend/utils/objects';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { QuestionType } from '@/models/questions/question-type';
import { LabellingRound } from '@/models/rounds/labelling';
import { PlayerStatus } from '@/models/users/player';

export default class GameLabellingQuestionService extends GameBuzzerQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.LABELLING);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as LabellingQuestion;
    if (!baseQuestion) {
      console.error('Base question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
      throw new Error('Base question not found');
    }

    const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameLabellingQuestion;
    if (!gameQuestion) {
      console.error('Game question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
      throw new Error('Game question not found');
    }

    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (!playerIds) {
      console.error('Player IDs not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
      throw new Error('Player IDs not found');
    }

    await (this.gameQuestionRepo as GameLabellingQuestionRepository).resetPlayersTransaction(transaction, questionId);
    await (this.gameQuestionRepo as GameLabellingQuestionRepository).updateQuestionTransaction(
      transaction,
      questionId,
      {
        revealed: baseQuestion.getInitialRevealed(),
      }
    );

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
    const questionPlayers = await (this.gameQuestionRepo as GameLabellingQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    );
    if (!questionPlayers) {
      console.error('Question players not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
      throw new Error('Question players not found');
    }

    const buzzed = questionPlayers.buzzed;

    const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameLabellingQuestion;
    if (!gameQuestion) {
      console.error('Game question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
      throw new Error('Game question not found');
    }

    if (buzzed.length === 0) {
      await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
    } else {
      await (this.gameQuestionRepo as GameLabellingQuestionRepository).cancelPlayerTransaction(
        transaction,
        questionId,
        buzzed[0]
      );

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
        const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as LabellingQuestion;
        if (!baseQuestion) {
          console.error('Base question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Base question not found');
        }

        const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        )) as GameLabellingQuestion;
        if (!gameQuestion) {
          console.error('Game question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Game question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as LabellingRound;
        if (!round) {
          console.error('Round not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Round not found');
        }
        const labellingRound = round as LabellingRound;

        const questionPlayers = await (this.gameQuestionRepo as GameLabellingQuestionRepository).getPlayersTransaction(
          transaction,
          questionId
        );
        if (!questionPlayers) {
          console.error(
            'Question players not found',
            'game',
            this.gameId,
            'round',
            this.roundId,
            'question',
            questionId
          );
          throw new Error('Question players not found');
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
            console.error('Player not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
            throw new Error('Player not found');
          }

          await this.roundScoreRepo.increaseTeamScoreTransaction(
            transaction,
            questionId,
            player.teamId,
            labellingRound.rewardsPerElement
          );
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        }

        const labels = baseQuestion.labels!;

        const allRevealed = range(labels.length).every((index) => {
          return newRevealed[index] && !isObjectEmpty(newRevealed[index]);
        });

        await (this.gameQuestionRepo as GameLabellingQuestionRepository).updateQuestionRevealedElementsTransaction(
          transaction,
          questionId,
          newRevealed
        );

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
        const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as LabellingQuestion;
        if (!baseQuestion) {
          console.error('Base question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Base question not found');
        }

        const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        )) as GameLabellingQuestion;
        if (!gameQuestion) {
          console.error('Game question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Game question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as LabellingRound;
        if (!round) {
          console.error('Round not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Round not found');
        }

        const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
        if (!player) {
          console.error('Player not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Player not found');
        }

        const newRevealed = gameQuestion.revealed;
        newRevealed.fill({
          revealedAt: Timestamp.now(),
          playerId,
        });

        /* Update the winner team scores */
        const multiplier = baseQuestion.labels!.length;
        const points = round.rewardsPerElement * multiplier;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, player.teamId, points);

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);

        await (this.gameQuestionRepo as GameLabellingQuestionRepository).updateQuestionRevealedElementsTransaction(
          transaction,
          questionId,
          newRevealed
        );

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
        await (this.gameQuestionRepo as GameLabellingQuestionRepository).cancelPlayerTransaction(
          transaction,
          questionId,
          playerId
        );
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
