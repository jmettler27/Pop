import { runTransaction, Timestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
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
    this.log = logger.child({ module: 'GameLabellingQuestionService', game: gameId, round: roundId });
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string): Promise<void> {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as LabellingQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }

    const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameLabellingQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const playerIds = await this.playerRepo.getAllPlayerIds();
    if (!playerIds) {
      this.log.warn({ question: questionId }, 'Player IDs not found');
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

    this.log.info({ question: questionId }, 'Labelling question reset');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = await (this.gameQuestionRepo as GameLabellingQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    );
    if (!questionPlayers) {
      this.log.warn({ question: questionId }, 'Question players not found');
      throw new Error('Question players not found');
    }

    const buzzed = questionPlayers.buzzed;

    const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameLabellingQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
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

    this.log.info({ question: questionId }, 'Labelling question countdown end handled');
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
          this.log.warn({ question: questionId }, 'Base question not found');
          throw new Error('Base question not found');
        }

        const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        )) as GameLabellingQuestion;
        if (!gameQuestion) {
          this.log.warn({ question: questionId }, 'Game question not found');
          throw new Error('Game question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as LabellingRound;
        if (!round) {
          this.log.warn({ question: questionId }, 'Round not found');
          throw new Error('Round not found');
        }
        const labellingRound = round as LabellingRound;

        const questionPlayers = await (this.gameQuestionRepo as GameLabellingQuestionRepository).getPlayersTransaction(
          transaction,
          questionId
        );
        if (!questionPlayers) {
          this.log.warn({ question: questionId }, 'Question players not found');
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
            this.log.warn({ question: questionId }, 'Player not found');
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

        this.log.info({ question: questionId, labelIdx }, 'Labelling question label revealed');
      });
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to reveal the label');
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
          this.log.warn({ question: questionId }, 'Base question not found');
          throw new Error('Base question not found');
        }

        const gameQuestion = (await (this.gameQuestionRepo as GameLabellingQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        )) as GameLabellingQuestion;
        if (!gameQuestion) {
          this.log.warn({ question: questionId }, 'Game question not found');
          throw new Error('Game question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as LabellingRound;
        if (!round) {
          this.log.warn({ question: questionId }, 'Round not found');
          throw new Error('Round not found');
        }

        const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
        if (!player) {
          this.log.warn({ question: questionId }, 'Player not found');
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

        this.log.info({ question: questionId }, 'Labelling question all labels validated');
      });
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to validate all labels');
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

        this.log.info({ question: questionId, player: playerId }, 'Labelling player canceled');
      });
    } catch (error) {
      this.log.error({ question: questionId, err: error }, 'Failed to cancel the player');
      throw error;
    }
  }
}
