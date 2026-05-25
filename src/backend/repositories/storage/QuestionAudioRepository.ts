import StorageRepository from '@/backend/repositories/storage/StorageRepository';

export default class QuestionAudioRepository extends StorageRepository {
  constructor() {
    super('questions/audio');
  }

  async uploadQuestionAudio(questionId: string, audio: File): Promise<string> {
    return this.uploadFile(audio, questionId);
  }
}
