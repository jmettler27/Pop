import BaseQuestionRepositoryFactory from '@/backend/repositories/question/base/BaseQuestionRepositoryFactory';
import QuestionImageRepository from '@/backend/repositories/storage/QuestionImageRepository';
import QuestionAudioRepository from '@/backend/repositories/storage/QuestionAudioRepository';

import { runTransaction } from 'firebase/firestore';
import { firestore } from '@/backend/firebase/firebase';

/**
 * Service for adding questions to the database
 */
export default class QuestionCreatorService {
  /**
   * Constructor for the QuestionCreatorService class.
   *
   * @param {string} type - The type of question to create.
   */
  constructor(type) {
    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(type);
  }

  /**
   * Submits a question
   *
   * @param {Object} data - The data of the question
   * @param {string} userId - The user id of the question
   * @param {Object} files - The files of the question
   *
   * @returns {Promise<Object>} The question
   */
  async submitQuestion(data, userId, files = {}) {
    if (!data) {
      throw new Error('Data is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      return await runTransaction(firestore, async (transaction) => {
        // Create the question document with current timestamp
        const baseQuestion = await this.baseQuestionRepo.createQuestionTransaction(transaction, {
          ...data,
          createdAt: new Date(),
          createdBy: userId,
          approved: true,
        });

        // Handle file uploads if any
        let hasFiles = false;

        if (files.image) {
          this.imageRepo = new QuestionImageRepository();
          const imageUrl = await this.imageRepo.uploadImage(baseQuestion.id, files.image);
          baseQuestion.setImage(imageUrl);
          hasFiles = true;
        }

        if (files.audio) {
          this.audioRepo = new QuestionAudioRepository();
          const audioUrl = await this.audioRepo.uploadAudio(baseQuestion.id, files.audio);
          baseQuestion.setAudio(audioUrl);
          hasFiles = true;
        }

        // Update the question with file URLs if any files were uploaded
        if (hasFiles) {
          await this.baseQuestionRepo.updateQuestionTransaction(transaction, baseQuestion.id, baseQuestion.toObject());
        }

        return baseQuestion.id;
      });
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }
}
