import { runTransaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameRepository from '@/backend/repositories/game/GameRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import { GameStatus } from '@/models/games/game-status';
import { Timer } from '@/models/timer';

export default class TimerService {
  private gameId: string;
  private gameRepo: GameRepository;
  private soundRepo: SoundRepository;
  private timerRepo: TimerRepository;

  constructor(gameId: string) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    this.gameId = gameId;
    this.gameRepo = new GameRepository();
    this.soundRepo = new SoundRepository(gameId);
    this.timerRepo = new TimerRepository(gameId);
  }

  async endTimer() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.timerRepo.endTimerTransaction(transaction);

        console.log('Timer ended');
      });
    } catch (error) {
      console.error('Error ending timer:', error);
      throw error;
    }
  }

  async startTimer(duration: number) {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.soundRepo.addSoundTransaction(transaction, 'message_incoming');
        await this.timerRepo.startTimerTransaction(transaction, duration);

        console.log('Timer started');
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }

  async stopTimer() {
    try {
      await runTransaction(firestore, async (transaction) => {
        await this.timerRepo.stopTimerTransaction(transaction);

        console.log('Timer stopped');
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }

  async resetTimer() {
    try {
      await runTransaction(firestore, async (transaction) => {
        const game = await this.gameRepo.getGameTransaction(transaction, this.gameId);
        if (!game) throw new Error('Game not found');
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
          console.log('GAME QUESTION', 'gameQuestion', gameQuestion);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          duration = (gameQuestion as any).thinkingTime;
        }
        await this.timerRepo.resetTimerTransaction(transaction, duration);

        console.log('Timer reset');
      });
    } catch (error) {
      console.error('Error resetting timer:', error);
      throw error;
    }
  }
}
