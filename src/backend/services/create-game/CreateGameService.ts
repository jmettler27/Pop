import { runTransaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameRepository from '@/backend/repositories/game/GameRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import { CreateGameRoundsData } from '@/models/games/game';

/**
 * Service for creating a new game
 */
export default class CreateGameService {
  private gameRepo: GameRepository;

  constructor() {
    this.gameRepo = new GameRepository();
  }

  /**
   * Creates a new game
   *
   * @param {Object} data - The data of the game
   *
   * @returns {Promise<Object>} The game
   */
  async createGame(data: CreateGameRoundsData): Promise<string> {
    if (!data) {
      throw new Error('Data is required');
    }
    console.log('Creating game with data:', data);

    try {
      return await runTransaction(firestore, async (transaction) => {
        const { title, type, lang, maxPlayers, roundScorePolicy, organizerName, organizerId, organizerImage } = data;
        console.log('Creating game with data:', {
          title,
          type,
          lang,
          maxPlayers,
          roundScorePolicy,
          organizerName,
          organizerId,
          organizerImage,
        });

        const game = await this.gameRepo.createGameTransaction(transaction, data);
        const gameId = game.id;
        if (!gameId) throw new Error('Game creation failed: no ID returned');

        const organizerRepo = new OrganizerRepository(gameId);
        await organizerRepo.createOrganizerTransaction(transaction, {
          id: organizerId,
          name: organizerName,
          image: organizerImage,
        });

        const readyRepo = new ReadyRepository(gameId);
        await readyRepo.initializeReadyTransaction(transaction);

        const scoreRepo = new GameScoreRepository(gameId);
        await scoreRepo.initializeScoresTransaction(transaction);

        const chooserRepo = new ChooserRepository(gameId);
        await chooserRepo.createChooserTransaction(transaction);

        const timerRepo = new TimerRepository(gameId);
        await timerRepo.initializeTimerTransaction(transaction, organizerId);

        const soundRepo = new SoundRepository(gameId);
        await soundRepo.initializeSoundsTransaction(transaction);

        console.log('Game created successfully.', 'gameId: ', gameId);
        return gameId;
      });
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }
}
