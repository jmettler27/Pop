import { runTransaction } from 'firebase/firestore';
import type { Logger } from 'pino';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameRepository from '@/backend/repositories/game/GameRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import { GameStatus } from '@/models/games/game-status';
import { GameQuestion } from '@/models/questions/question';
import { Timer } from '@/models/timer';

export default class TimerService {
  private gameId: string;
  private gameRepo: GameRepository;
  private soundRepo: SoundRepository;
  private timerRepo: TimerRepository;
  private log: Logger;

  constructor(gameId: string) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    this.gameId = gameId;
    this.log = logger.child({ module: 'TimerService', game: this.gameId });
    this.gameRepo = new GameRepository();
    this.soundRepo = new SoundRepository(gameId);
    this.timerRepo = new TimerRepository(gameId);
  }

  async endTimer() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.timerRepo.endTimerTransaction(transaction);

        this.log.info('Timer ended');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error ending timer');
      throw error;
    }
  }

  async startTimer(duration: number) {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'message_incoming');
        await this.timerRepo.startTimerTransaction(transaction, duration);

        this.log.info({ duration }, 'Timer started');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error starting timer');
      throw error;
    }
  }

  async stopTimer() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.timerRepo.stopTimerTransaction(transaction);

        this.log.info('Timer stopped');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error stopping timer');
      throw error;
    }
  }

  async resetTimer() {
    try {
      await runTransaction(firestore, async (transaction) => {
        const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
        if (!game) {
          this.log.warn('Game not found');
          throw new Error('Game not found');
        }

        let duration = 30; // Default duration to reset to
        if (
          game.status === GameStatus.ROUND_START ||
          game.status === GameStatus.ROUND_END ||
          game.status === GameStatus.QUESTION_END
        ) {
          duration = Timer.READY_COUNTDOWN_SECONDS;
        } else if (game.status === GameStatus.QUESTION_ACTIVE) {
          const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
            game.currentQuestionType!,
            this.gameId,
            game.currentRound as string
          );
          const gameQuestion = await gameQuestionRepo.getQuestionTransaction(
            transaction,
            game.currentQuestion as string
          );
          if (!gameQuestion) {
            this.log.warn({ question: game.currentQuestion }, 'Game question not found');
            throw new Error('Game question not found');
          }

          duration = (gameQuestion as GameQuestion).thinkingTime!;
        }
        await this.timerRepo.resetTimerTransaction(transaction, duration);

        this.log.info({ duration }, 'Timer reset');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error resetting timer');
      throw error;
    }
  }
}
