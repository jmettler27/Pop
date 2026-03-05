import StorageRepository from '@/backend/repositories/storage/StorageRepository';

/**
 * Repository for images
 */
export default class QuestionImageRepository extends StorageRepository {
  constructor() {
    super('questions/images');
  }

  /**
   * Upload an image file to the storage for a question
   *
   * @param {string} questionId - The ID of the question
   * @param {File} image - The image file to upload
   * @returns {Promise<string>} The download URL
   */
  async uploadQuestionImage(questionId, image) {
    return await this.uploadFile(image, questionId);
  }
}
