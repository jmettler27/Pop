import SoundRepository from '@/backend/repositories/storage/SoundRepository';

const soundsRepository = new SoundRepository();

/**
 * Load all sounds from the storage
 *
 * @returns {Object} The sounds
 */
export async function loadSounds() {
  return await soundsRepository.loadAllSounds();
}
