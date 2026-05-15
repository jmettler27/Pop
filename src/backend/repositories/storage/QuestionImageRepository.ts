import StorageRepository from '@/backend/repositories/storage/StorageRepository';

export default class QuestionImageRepository extends StorageRepository {
  constructor() {
    super('questions/images');
  }

  async uploadQuestionImage(questionId: string, image: File): Promise<string> {
    return this.uploadFile(image, questionId);
  }
}
