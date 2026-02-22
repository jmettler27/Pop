import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { runTransaction, serverTimestamp } from 'firebase/firestore';

import { getRandomElement } from '@/backend/utils/arrays';
import { firestore } from '@/backend/firebase/firebase';

const WRONG_ANSWER_SOUNDS = ['roblox_oof', 'oof', 'terraria_male_damage', 'itai'];

/**
 * SoundRepository
 *
 * @extends FirebaseRepository
 */
export default class SoundRepository extends FirebaseRepository {
  constructor(gameId) {
    super(['games', gameId, 'realtime', 'sounds', 'queue']);
  }

  /**
   * Initializes the sound transaction
   *
   * @param {Transaction} transaction - The transaction
   *
   * @returns {Promise<Object>} The sound
   */
  async initializeSoundsTransaction(transaction) {
    return await this.createTransaction(transaction, {
      played: false,
      timestamp: serverTimestamp(),
    });
  }

  /**
   * Adds a sound to the queue
   *
   * @param {string} filename - The filename of the sound
   *
   * @returns {Promise<Object>} The sound
   */
  async addSound(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => await this.addSoundTransaction(transaction, filename));
    } catch (error) {
      console.error('Error adding sound', error);
      throw error;
    }
  }

  /**
   * Adds a sound to the queue
   *
   * @param {Transaction} transaction - The transaction
   * @param {string} filename - The filename of the sound
   *
   * @returns {Promise<Object>} The sound
   */
  async addSoundTransaction(transaction, filename) {
    const sound = await this.createTransaction(transaction, {
      filename: filename,
      timestamp: serverTimestamp(),
    });

    console.log('Sound added', 'game', this.gameId, 'filename', filename);

    return sound;
  }

  /**
   * Clears all sounds from the queue
   */
  async clearSounds() {
    try {
      await runTransaction(firestore, async (transaction) => {
        const sounds = await this.getAll();
        for (const sound of sounds) {
          await this.deleteTransaction(transaction, sound.id);
        }

        console.log('All sounds cleared', 'game', this.gameId);
      });
    } catch (error) {
      console.error('Error clearing sounds', error);
      throw error;
    }
  }

  /**
   * Adds a wrong answer sound to the queue
   *
   * @param {Transaction} transaction - The transaction
   */
  async addWrongAnswerSoundToQueueTransaction(transaction) {
    await this.addSoundTransaction(transaction, getRandomElement(WRONG_ANSWER_SOUNDS));
  }
}
