import { logger } from '@/backend/logger';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import QuestionAudioRepository from '@/backend/repositories/storage/QuestionAudioRepository';
import QuestionImageRepository from '@/backend/repositories/storage/QuestionImageRepository';
import { adminDb } from '@/firebase/admin';
import { UpdateBaseQuestionData, type CreateBaseQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';
import QuestionFactory from '@/models/questions/QuestionFactory';

const log = logger.child({ module: 'CreateQuestionService' });

/**
 * Service for adding questions to the database
 */
export default class CreateQuestionService {
  private baseQuestionRepo: ReturnType<typeof BaseQuestionRepositoryFactory.createRepository>;
  private imageRepo: QuestionImageRepository | undefined;
  private audioRepo: QuestionAudioRepository | undefined;

  constructor(type: QuestionType) {
    this.baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(type);
  }

  /**
   * Edits an existing question
   *
   * @param {string} questionId - The ID of the question to edit
   * @param {CreateBaseQuestionData} data - The updated data of the question
   * @param {Object} files - New files to replace existing ones (optional)
   *
   * @returns {Promise<string>} The question ID
   */
  async editQuestion(questionId: string, data: CreateBaseQuestionData, files: any = {}) {
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

      // Storage uploads must happen outside the transaction: they are non-transactional
      // side effects that would re-run on every retry of the callback.
      let imageUrl: string | undefined;
      let audioUrl: string | undefined;
      if (files.image) {
        this.imageRepo = new QuestionImageRepository();
        imageUrl = await this.imageRepo.uploadQuestionImage(questionId, files.image);
      }
      if (files.audio) {
        this.audioRepo = new QuestionAudioRepository();
        audioUrl = await this.audioRepo.uploadQuestionAudio(questionId, files.audio);
      }

      return await adminDb().runTransaction(async (transaction) => {
        const existingObj = existing.toObject();
        const mergedData = {
          id: questionId,
          ...existingObj,
          topic: data.topic,
          lang: data.lang,
          details: {
            ...(existingObj.details as Record<string, unknown>),
            ...data.details,
          },
        };

        const baseQuestion = QuestionFactory.createBaseQuestion(existing.type, mergedData);

        if (imageUrl) baseQuestion.setImage(imageUrl);
        if (audioUrl) baseQuestion.setAudio(audioUrl);

        await this.baseQuestionRepo.updateQuestionTransaction(
          transaction,
          questionId,
          baseQuestion.toObject() as UpdateBaseQuestionData
        );
        return questionId;
      });
    } catch (error) {
      log.error({ err: error }, 'Error editing question');
      throw error;
    }
  }

  /**
   * Submits a question
   *
   * @param {CreateBaseQuestionData} data - The data of the question
   * @param {string} userId - The user id of the question
   * @param {Object} files - The files of the question
   *
   * @returns {Promise<Object>} The question
   */
  async submitQuestion(data: CreateBaseQuestionData, userId: string, files: any = {}) {
    if (!data) {
      throw new Error('Data is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Reserve the doc id up front so Storage uploads (non-transactional side effects
      // that would re-run on every retry) can happen before the transaction opens.
      const questionId = this.baseQuestionRepo.collectionRef.doc().id;

      let imageUrl: string | undefined;
      let audioUrl: string | undefined;
      if (files.image) {
        this.imageRepo = new QuestionImageRepository();
        imageUrl = await this.imageRepo.uploadQuestionImage(questionId, files.image);
      }
      if (files.audio) {
        this.audioRepo = new QuestionAudioRepository();
        audioUrl = await this.audioRepo.uploadQuestionAudio(questionId, files.audio);
      }

      return await adminDb().runTransaction(async (transaction) => {
        const createData: CreateBaseQuestionData = {
          ...data,
          createdAt: new Date(),
          createdBy: userId,
          approved: true,
        };
        const baseQuestion = await this.baseQuestionRepo.createQuestionTransaction(transaction, createData, questionId);
        if (!baseQuestion) {
          throw new Error('Question not found');
        }

        if (imageUrl || audioUrl) {
          if (imageUrl) baseQuestion.setImage(imageUrl);
          if (audioUrl) baseQuestion.setAudio(audioUrl);
          await this.baseQuestionRepo.updateQuestionTransaction(
            transaction,
            baseQuestion.id!,
            baseQuestion.toObject() as UpdateBaseQuestionData
          );
        }

        return baseQuestion.id;
      });
    } catch (error) {
      log.error({ err: error }, 'Error creating question');
      throw error;
    }
  }
}
