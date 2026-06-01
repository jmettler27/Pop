import { runTransaction, serverTimestamp, type Transaction } from 'firebase/firestore';
import type { Logger } from 'pino';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { getRandomElement } from '@/backend/utils/arrays';

const WRONG_ANSWER_SOUNDS = ['roblox_oof', 'oof', 'terraria_male_damage', 'itai'];

export default class SoundRepository extends FirebaseRepository {
  private gameId: string;
  private log: Logger;

  constructor(gameId: string) {
    super(['games', gameId, 'realtime', 'sounds', 'queue']);
    this.gameId = gameId;
    this.log = logger.child({ module: 'SoundRepository', game: this.gameId });
  }

  async initializeSoundsTransaction(transaction: Transaction): Promise<Record<string, unknown>> {
    return this.createTransaction(transaction, {
      played: false,
      timestamp: serverTimestamp(),
    });
  }

  async addSound(filename: string): Promise<void> {
    if (!filename) {
      throw new Error('Filename is required');
    }
    try {
      await runTransaction(firestore, (transaction) => this.addSoundTransaction(transaction, filename));
    } catch (error) {
      this.log.error({ err: error }, 'Error adding sound');
      throw error;
    }
  }

  async addSoundTransaction(transaction: Transaction, filename: string): Promise<Record<string, unknown>> {
    const sound = await this.createTransaction(transaction, {
      filename,
      timestamp: serverTimestamp(),
    });
    this.log.debug({ filename }, 'Sound added');
    return sound;
  }

  async clearSounds(): Promise<void> {
    try {
      await runTransaction(firestore, async (transaction) => {
        const sounds = await this.getAll();
        for (const sound of sounds) {
          await this.deleteTransaction(transaction, sound.id as string);
        }
        this.log.info('All sounds cleared');
      });
    } catch (error) {
      this.log.error({ err: error }, 'Error clearing sounds');
      throw error;
    }
  }

  async addWrongAnswerSoundToQueueTransaction(transaction: Transaction): Promise<void> {
    await this.addSoundTransaction(transaction, getRandomElement(WRONG_ANSWER_SOUNDS));
  }
}
