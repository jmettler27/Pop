import { runTransaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import QuestionAudioRepository from '@/backend/repositories/storage/QuestionAudioRepository';
import QuestionImageRepository from '@/backend/repositories/storage/QuestionImageRepository';
import QuestionFactory from '@/models/questions/QuestionFactory';

/**
 * Service for adding questions to the database
 */
export default class CreateQuestionService {
  /**
   * Constructor for the CreateQuestionService class.
   *
   * @param {string} type - The type of question to create.
   */
  constructor(type) {
    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(type);
  }

  /**
   * Edits an existing question
   *
   * @param {string} questionId - The ID of the question to edit
   * @param {Object} data - The updated data of the question
   * @param {Object} files - New files to replace existing ones (optional)
   *
   * @returns {Promise<string>} The question ID
   */
  async editQuestion(questionId, data, files = {}) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!data) {
      throw new Error('Data is required');
    }

    try {
      const existing = await this.baseQuestionRepo.getQuestion(questionId);
      if (!existing) {
        throw new Error(`Question ${questionId} not found`);
      }

      return await runTransaction(firestore, async (transaction) => {
        const existingObj = existing.toObject();
        const mergedData = {
          id: questionId,
          ...existingObj,
          topic: data.topic,
          lang: data.lang,
          details: {
            ...existingObj.details,
            ...data.details,
          },
        };

        const baseQuestion = QuestionFactory.createBaseQuestion(existing.type, mergedData);

        if (files.image) {
          this.imageRepo = new QuestionImageRepository();
          const imageUrl = await this.imageRepo.uploadQuestionImage(questionId, files.image);
          baseQuestion.setImage(imageUrl);
        }

        if (files.audio) {
          this.audioRepo = new QuestionAudioRepository();
          const audioUrl = await this.audioRepo.uploadQuestionAudio(questionId, files.audio);
          baseQuestion.setAudio(audioUrl);
        }

        await this.baseQuestionRepo.updateQuestionTransaction(transaction, questionId, baseQuestion.toObject());
        return questionId;
      });
    } catch (error) {
      console.error('Error editing question:', error);
      throw error;
    }
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
          const imageUrl = await this.imageRepo.uploadQuestionImage(baseQuestion.id, files.image);
          baseQuestion.setImage(imageUrl);
          hasFiles = true;
        }

        if (files.audio) {
          this.audioRepo = new QuestionAudioRepository();
          const audioUrl = await this.audioRepo.uploadQuestionAudio(baseQuestion.id, files.audio);
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
