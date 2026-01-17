import StorageRepository from '@/backend/repositories/storage/StorageRepository';

/**
 * Repository for images
 */
export default class QuestionImageRepository extends StorageRepository {
  constructor() {
    super('images');
  }

  /**
   * Upload an image file to the storage
   *
   * @param {File} imageFile - The image file to upload
   * @param {string} path - The path to upload the image file to
   * @returns {Promise<string>} The download URL
   */
  async uploadImage(imageFile, path) {
    return await this.uploadFile(imageFile, path);
  }

  /**
   * Upload an image file to the storage for a question
   *
   * @param {string} questionId - The ID of the question
   * @param {File} image - The image file to upload
   * @returns {Promise<string>} The download URL
   */
  async uploadQuestionImage(questionId, image) {
    return await this.uploadImage(image, `questions/${questionId}`);
  }
}
