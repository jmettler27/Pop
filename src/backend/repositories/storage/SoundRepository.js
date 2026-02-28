import StorageRepository from '@/backend/repositories/storage/StorageRepository';
import { listAll, getDownloadURL } from 'firebase/storage';
import { runTransaction } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';

/**
 * Repository for sounds
 */
export default class SoundRepository extends StorageRepository {
  constructor() {
    super('sounds');
  }

  /**
   * Upload a sound file to the storage
   *
   * @param {File} soundFile - The sound file to upload
   * @param {string} name - The name of the sound file
   *
   * @returns {Promise<string>} The download URL
   */
  async uploadSound(soundFile, name) {
    return await this.uploadFile(soundFile, name);
  }

  /**
   * Load all sounds from the storage
   *
   * @returns {Promise<Object>} The sounds
   */
  async loadAllSounds() {
    const soundsRef = this.getRef('');
    try {
      const { items } = await listAll(soundsRef);
      const sounds = {};
      for (const item of items) {
        const name = item.name.split('.')[0];
        const url = await getDownloadURL(item);
        sounds[name] = { name, url };
      }
      return sounds;
    } catch (err) {
      console.error(err);
      return {};
    }
  }

  async clearSoundsTransaction(transaction) {
    await runTransaction(firestore, async (transaction) => {
      // const queueSnapshot = await this.soundQueueRepo.getAll();
      // for (const doc of queueSnapshot.docs) {
      //     transaction.delete(doc.ref)
      // }
    });
  }
}
