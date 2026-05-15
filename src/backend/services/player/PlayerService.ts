import { runTransaction, serverTimestamp } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import { Timer, TimerStatus } from '@/models/timer';
import { PlayerStatus } from '@/models/users/player';

export default class PlayerService {
  private gameId: string;
  private playerRepo: PlayerRepository;
  private timerRepo: TimerRepository;
  private soundRepo: SoundRepository;
  private readyRepo: ReadyRepository;

  constructor(gameId: string) {
    if (!gameId) {
      throw new Error('Game ID is required');
    }

    this.gameId = gameId;
    this.playerRepo = new PlayerRepository(this.gameId);
    this.timerRepo = new TimerRepository(this.gameId);
    this.soundRepo = new SoundRepository(this.gameId);
    this.readyRepo = new ReadyRepository(this.gameId);
  }

  async setPlayerReady(playerId: string) {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const ready = await this.readyRepo.getReadyTransaction(transaction);
        if (!ready) {
          throw new Error('Ready document');
        }

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
            timestamp: serverTimestamp(),
          });
          // await this.togglePlayerAuthorizationTransaction(transaction, false);
        }
      });
    } catch (error) {
      console.error('Failed to setting the player ready', error);
      throw error;
    }
  }

  async togglePlayerAuthorization(authorized: boolean | null = null) {
    try {
      await runTransaction(firestore, async (transaction) => {
        let newVal = authorized;
        if (authorized === null) {
          const timer = await this.timerRepo.getTimerTransaction(transaction);
          if (!timer) {
            console.log();
            throw new Error();
          }

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
