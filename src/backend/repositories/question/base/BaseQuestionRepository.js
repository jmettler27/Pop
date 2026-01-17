import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import QuestionFactory from '@/backend/models/questions/QuestionFactory';

export default class BaseQuestionRepository extends FirebaseRepository {
  /**
   * Constructor for the BaseQuestionRepository class.
   *
   * @param {string} questionType - The type of question to create.
   */
  constructor(questionType) {
    super('questions');
    this.questionType = questionType;
  }

  /**
   * Gets a question with the given ID.
   * @param {string} questionId - The ID of the question to get.
   * @returns {BaseQuestion} The question.
   */
  async getQuestion(questionId) {
    const data = await super.get(questionId);
    return data ? QuestionFactory.createBaseQuestion(data.type, data) : null;
  }

  /**
   * Gets a question with the given ID using a transaction.
   * @param {Transaction} transaction - The transaction to use.
   * @param {string} questionId - The ID of the question to get.
   * @returns {BaseQuestion} The question.
   */
  async getQuestionTransaction(transaction, questionId) {
    const data = await super.getTransaction(transaction, questionId);
    return data ? QuestionFactory.createBaseQuestion(data.type, data) : null;
  }

  /**
   * Gets questions created by the given user.
   * @param {string} userId - The ID of the user to get questions for.
   * @returns {Promise<BaseQuestion[]>} The questions created by the user.
   */
  async getQuestionsCreatedBy(userId) {
    const questions = await super.getByField('createdBy', userId);
    return questions.map((q) => QuestionFactory.createBaseQuestion(q.type, q));
  }

  /**
   * Creates a question with the given data.
   * @param {Object} data - The data to create the question with.
   * @returns {BaseQuestion} The created question.
   */
  async createQuestion(data) {
    try {
      await runTransaction(firestore, async (transaction) => {
        return await this.createQuestionTransaction(transaction, data);
      });
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  /**
   * Creates a question with the given data using a transaction.
   * @param {Transaction} transaction - The transaction to use.
   * @param {Object} data - The data to create the question with.
   * @returns {BaseQuestion} The created question.
   */
  async createQuestionTransaction(transaction, data) {
    const type = data.type;
    const question = QuestionFactory.createBaseQuestion(type, data);
    const createData = await super.createTransaction(transaction, question.toObject());
    return createData ? QuestionFactory.createBaseQuestion(type, createData) : null;
  }

  /**
   * Sets a question with the given data.
   * @param {string} questionId - The ID of the question to set.
   * @param {Object} data - The data to set the question with.
   * @returns {BaseQuestion} The set question.
   */
  async setQuestion(questionId, data) {
    const setData = await super.set(data, questionId);
    return setData ? QuestionFactory.createBaseQuestion(setData.type, setData) : null;
  }

  /**
   * Updates a question with the given data.
   * @param {string} questionId - The ID of the question to update.
   * @param {Object} data - The data to update the question with.
   * @returns {BaseQuestion} The updated question.
   */
  async updateQuestion(questionId, data) {
    const updateData = await super.update(questionId, data);
    return updateData ? QuestionFactory.createBaseQuestion(updateData.type, updateData) : null;
  }

  /**
   * Updates a question with the given data using a transaction.
   * @param {Transaction} transaction - The transaction to use.
   * @param {string} questionId - The ID of the question to update.
   * @param {Object} data - The data to update the question with.
   * @returns {BaseQuestion} The updated question.
   */
  async updateQuestionTransaction(transaction, questionId, data) {
    const updateData = await super.updateTransaction(transaction, questionId, data);
    return updateData ? QuestionFactory.createBaseQuestion(updateData.type, updateData) : null;
  }

  // React hooks
  useQuestionOnce(questionId) {
    const { data, loading, error } = super.useDocumentOnce(questionId);
    return {
      baseQuestion: data ? QuestionFactory.createBaseQuestion(data.type, data) : null,
      baseQuestionLoading: loading,
      baseQuestionError: error,
    };
  }
}

//function applyQuestionQueryFilters(q, { lang, topic, type, keyword, sort, approved = true }) {
//    if (approved) {
//        q = query(q, where("approved", "==", approved));
//    }
//    if (lang) {
//        q = query(q, where("lang", "==", lang));
//    }
//    if (topic) {
//        q = query(q, where("topic", "==", topic));
//    }
//    if (type) {
//        q = query(q, where("type", "==", type));
//    }
//    if (keyword) {
//        q = query(q, where("keywords", "array-contains", keyword));
//    }
//    if (sort === "Date of creation" || !sort) {
//        q = query(q, orderBy("createdAt", "desc"));
//        // } else if (sort === "Review") {
//        // q = query(q, orderBy("numRatings", "desc"));
//    }
//    return q;
//}
