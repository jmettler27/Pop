import StorageRepository from '@/backend/repositories/storage/StorageRepository';

/**
 * Repository for audio files
 */
export default class QuestionAudioRepository extends StorageRepository {
  constructor() {
    super('questions/audio');
  }

  /**
   * Upload an audio file to the storage for a question
   *
   * @param {string} questionId - The ID of the question
   * @param {File} audio - The audio file to upload
   * @returns {Promise<string>} The download URL
   */
  async uploadQuestionAudio(questionId, audio) {
    return await this.uploadFile(audio, questionId);
  }
}
