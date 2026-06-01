import { runTransaction, serverTimestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import RoundRepository from '@/backend/repositories/round/RoundRepository';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { GameStatus } from '@/models/games/game-status';
import { GameBuzzerQuestion } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';
import { BuzzerRound } from '@/models/rounds/buzzer';
import { PlayerStatus } from '@/models/users/player';

export default class GameBuzzerQuestionService extends GameQuestionService {
  constructor(gameId: string, roundId: string, questionType: QuestionType) {
    super(gameId, roundId, questionType);
    this.log = logger.child({ module: 'GameBuzzerQuestionService', game: gameId, round: roundId });
    this.roundRepo = new RoundRepository(gameId);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const gameQuestion = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    );
    if (!gameQuestion) {
      throw new Error('Game question not found');
    }

    await (this.gameQuestionRepo as GameBuzzerQuestionRepository).resetQuestionTransaction(transaction, questionId);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
  }

  async endQuestion(questionId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        // Update game status
        await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.QUESTION_END);
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).updateTransaction(transaction, questionId, {
          dateEnd: serverTimestamp(),
        });
        await this.timerRepo.prepareTimerForReadyTransaction(transaction);

        this.log.info({ question: questionId, type: this.questionType }, 'Buzzer question ended');
      });
    } catch (error) {
      this.log.error({ question: questionId, type: this.questionType, err: error }, 'Failed to end buzzer question');
      throw error;
    }
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    );
    if (!questionPlayers) {
      this.log.warn({ question: questionId, type: this.questionType }, 'Question players not found');
      throw new Error('Question players not found');
    }
    const buzzed = questionPlayers.buzzed;
    const gameQuestion = (await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
      transaction,
      questionId
    )) as GameBuzzerQuestion;
    const thinkingTime = gameQuestion.thinkingTime;

    if (buzzed.length === 0) {
      await this.timerRepo.resetTimerTransaction(transaction, thinkingTime);
    } else {
      await this.invalidateAnswerTransaction(transaction, questionId, buzzed[0]);

      // If there's a next player in the queue, start their countdown
      if (buzzed.length > 1) {
        const thinkingTime = gameQuestion.thinkingTime;
        await this.playerRepo.updatePlayerStatusTransaction(transaction, buzzed[1], PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, thinkingTime);
      } else {
        await this.timerRepo.resetTimerTransaction(transaction, thinkingTime);
      }
    }
  }

  /* =============================================================================================================== */
  async handleBuzzerHeadChanged(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const gameQuestion = (await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        )) as GameBuzzerQuestion;

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, gameQuestion.thinkingTime);

        this.log.info(
          { question: questionId, type: this.questionType, player: playerId },
          'Buzzer head change handled'
        );
      });
    } catch (error) {
      this.log.error(
        { question: questionId, type: this.questionType, err: error },
        'Failed to handle buzzer head change'
      );
      throw error;
    }
  }

  async addPlayerToBuzzer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).addPlayerToBuzzerTransaction(
          transaction,
          questionId,
          playerId
        );
        await this.soundRepo.addSoundTransaction(transaction, 'sfx_menu_validate');

        this.log.info({ question: questionId, type: this.questionType, player: playerId }, 'Player added to buzzer');
      });
    } catch (error) {
      this.log.error(
        { question: questionId, type: this.questionType, player: playerId, err: error },
        'Failed to add player to buzzer'
      );
      throw error;
    }
  }

  async removePlayerFromBuzzer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).removePlayerFromBuzzerTransaction(
          transaction,
          questionId,
          playerId
        );
        const gameQuestion = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        );
        if (!gameQuestion) {
          this.log.warn({ question: questionId }, 'Game question not found when removing player from buzzer');
          throw new Error('Game question not found when removing player from buzzer');
        }

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        await this.soundRepo.addSoundTransaction(transaction, 'jpp_de_lair');

        this.log.info(
          { question: questionId, type: this.questionType, player: playerId },
          'Player removed from buzzer'
        );
      });
    } catch (error) {
      this.log.error(
        { question: questionId, type: this.questionType, player: playerId, err: error },
        'Failed to remove player from buzzer'
      );
      throw error;
    }
  }

  async clearBuzzer(questionId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const gameQuestion = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestionTransaction(
          transaction,
          questionId
        );
        if (!gameQuestion) {
          this.log.warn({ question: questionId }, 'Game question not found when clearing buzzer');
          throw new Error('Game question not found when clearing buzzer');
        }

        const questionPlayers = await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getPlayersTransaction(
          transaction,
          questionId
        );
        if (!questionPlayers) {
          this.log.warn({ question: questionId, type: this.questionType }, 'Question players not found');
          throw new Error('Question players not found');
        }

        const buzzed = questionPlayers.buzzed!;

        for (const playerId of buzzed) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.IDLE);
        }
        await (this.gameQuestionRepo as GameBuzzerQuestionRepository).clearBuzzedPlayersTransaction(
          transaction,
          questionId
        );
        await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);
        await this.soundRepo.addSoundTransaction(transaction, 'robinet_desert');

        this.log.info({ question: questionId, type: this.questionType }, 'Buzzer cleared');
      });
    } catch (error) {
      this.log.error({ question: questionId, type: this.questionType, err: error }, 'Failed to clear buzzer');

      throw error;
    }
  }

  async validateAnswer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction: Transaction) =>
        this.validateAnswerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      this.log.error(
        { question: questionId, type: this.questionType, player: playerId, err: error },
        'Failed to validate answer to buzzer question'
      );
      throw error;
    }
  }

  async validateAnswerTransaction(transaction: Transaction, questionId: string, playerId: string) {
    // Update the winner team scores
    const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
    if (!player) {
      this.log.warn({ question: questionId, player: playerId }, 'Player not found');
      throw new Error('Player not found');
    }

    const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
    if (!round) {
      this.log.warn({ question: questionId, round: this.roundId }, 'Round not found');
      throw new Error('Round not found');
    }

    const teamId = player.teamId;
    const points = (round as BuzzerRound).rewardsPerQuestion;

    await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);

    // Update the winner player status
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);

    // Update the question winner team
    await (this.gameQuestionRepo as GameBuzzerQuestionRepository).updateQuestionWinnerTransaction(
      transaction,
      questionId,
      playerId,
      teamId
    );
    await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');

    await this.endQuestionTransaction(transaction, questionId);

    this.log.info({ question: questionId, type: this.questionType, player: playerId }, 'Answer validated');
  }

  async invalidateAnswer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, (transaction: Transaction) =>
        this.invalidateAnswerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      this.log.error(
        { question: questionId, type: this.questionType, player: playerId, err: error },
        'Failed to invalidate answer to buzzer question'
      );
      throw error;
    }
  }

  async invalidateAnswerTransaction(transaction: Transaction, questionId: string, playerId: string) {
    const gameQuestion = (await (this.gameQuestionRepo as GameBuzzerQuestionRepository).getQuestion(
      questionId
    )) as GameBuzzerQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId, type: this.questionType }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const clueIdx = (gameQuestion as GameBuzzerQuestion & { currentClueIdx?: number }).currentClueIdx ?? 0;

    await (this.gameQuestionRepo as GameBuzzerQuestionRepository).cancelPlayerTransaction(
      transaction,
      questionId,
      playerId,
      clueIdx
    );
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    this.log.info({ question: questionId, type: this.questionType, player: playerId }, 'Answer invalidated');
  }
}
