import StorageRepository from '@/backend/repositories/storage/StorageRepository';

/**
 * Repository for audio files
 */
export default class QuestionAudioRepository extends StorageRepository {
    constructor() {
        super('audio');
    }

    /**
     * Upload an audio file to the storage
     * 
     * @param {File} audioFile - The audio file to upload
     * @param {string} path - The path to upload the audio file to
     * @returns {Promise<string>} The download URL
     */
    async uploadAudio(audioFile, path) {
        return await this.uploadFile(audioFile, path);
    }

    /**
     * Upload an audio file to the storage for a question
     * 
     * @param {string} questionId - The ID of the question
     * @param {File} audio - The audio file to upload
     * @returns {Promise<string>} The download URL
     */
    async uploadQuestionAudio(questionId, audio) {
        return await this.uploadAudio(audio, `questions/${questionId}`);
    }
} 