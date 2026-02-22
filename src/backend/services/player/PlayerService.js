import PlayerRepository from '@/backend/repositories/user/PlayerRepository';

import { firestore } from '@/backend/firebase/firebase';
import { runTransaction } from 'firebase/firestore';

import { Timer, TimerStatus } from '@/backend/models/Timer';
import { PlayerStatus } from '@/backend/models/users/Player';

import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';

export default class PlayerService {
  constructor(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    this.gameId = gameId;
    this.playerRepo = new PlayerRepository(this.gameId);
    this.timerRepo = new TimerRepository(this.gameId);
    this.soundRepo = new SoundRepository(this.gameId);
    this.readyRepo = new ReadyRepository(this.gameId);
  }

  async setPlayerReady(playerId) {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const ready = await this.readyRepo.getTransaction(transaction);
        const numReady = ready.numReady;
        const numPlayers = ready.numPlayers;
        const newNumReady = numReady + 1;

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.READY);
        await this.readyRepo.updateNumReadyTransaction(transaction, newNumReady);

        // :-)
        const num = Math.floor(Math.random() * 50);
        await this.soundRepo.addSoundTransaction(transaction, num === 0 ? 'fart_perfecter' : 'pop');

        if (newNumReady === numPlayers) {
          await this.timerRepo.updateTransaction(transaction, {
            status: TimerStatus.START,
            duration: Timer.READY_COUNTDOWN_SECONDS,
            forward: false,
            authorized: false,
          });
          // await this.togglePlayerAuthorizationTransaction(transaction, false);
        }
      });
    } catch (error) {
      console.error('Failed to setting the player ready', error);
      throw error;
    }
  }

  async togglePlayerAuthorization(authorized = null) {
    try {
      await runTransaction(firestore, async (transaction) => {
        let newVal = authorized;
        if (authorized === null) {
          const timer = await this.timerRepo.getTransaction(transaction);
          newVal = !timer.authorized;
        }
        await this.timerRepo.updateTransaction(transaction, { authorized: newVal });
        if (newVal === true) await this.soundRepo.addSoundTransaction(transaction, 'minecraft_button_plate');

        console.log('Players authorization successfully toggled', 'game', this.gameId, 'authorized', newVal);
      });
    } catch (error) {
      console.error('Failed to toggle players authorization', 'game', this.gameId);
      throw error;
    }
  }
}
