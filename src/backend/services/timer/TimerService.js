import { firestore } from '@/backend/firebase/firebase';
import { runTransaction } from 'firebase/firestore';

import GameRepository from '@/backend/repositories/game/GameRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';

export default class TimerService {
  constructor(gameId) {
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
      await runTransaction(firestore, (transaction) => {
        this.timerRepo.endTimerTransaction(transaction);

        console.log('Timer ended');
      });
    } catch (error) {
      console.error('Error ending timer:', error);
      throw error;
    }
  }

  async startTimer(duration) {
    try {
      await runTransaction(firestore, (transaction) => {
        this.soundRepo.addSoundTransaction(transaction, 'message-incoming');
        this.timerRepo.startTimerTransaction(transaction, duration);

        console.log('Timer started');
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }

  async stopTimer() {
    try {
      await runTransaction(firestore, (transaction) => {
        this.timerRepo.stopTimerTransaction(transaction);

        console.log('Timer stopped');
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }

  async resetTimer() {
    try {
      await runTransaction(firestore, (transaction) => {
        this.timerRepo.resetTimerTransaction(transaction);

        console.log('Timer reset');
      });
    } catch (error) {
      console.error('Error resetting timer:', error);
      throw error;
    }
  }
}
