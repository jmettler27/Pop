import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import QuestionFactory from '@/backend/models/questions/QuestionFactory';

import { firestore } from "@/backend/firebase/firebase";

import { runTransaction } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/database';

export default class GameQuestionRepository extends FirebaseRepository {

    constructor(gameId, roundId, questionType) {
        super(['games', gameId, 'rounds', roundId, 'questions']);
        this.questionType = questionType;
    }

    /**
     * Get a game question
     * @param {string} questionId - The ID of the question
     * @returns {GameQuestion}
     */
    async getQuestion(questionId) {
        const data = await super.get(questionId);
        return data ? QuestionFactory.createGameQuestion(this.questionType, data) : null;
    }

    /**
     * Get a game question transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} questionId - The ID of the question
     * @returns {GameQuestion}
     */
    async getQuestionTransaction(transaction, questionId) {
        const data = await super.getTransaction(transaction, questionId);
        return data ? QuestionFactory.createGameQuestion(this.questionType, data) : null;
    }

    /**
     * Create a game question
     * @param {string} questionId - The ID of the question
     * @param {string} managerId - The ID of the manager
     * @param {Object} data - The data of the question
     */
    async createGameQuestion(questionId, managerId, data) {
        try {
            await runTransaction(firestore, async (transaction) => {
                await this.createQuestionTransaction(transaction, this.questionType, questionId, managerId, data);
            });
        } catch (error) {
            console.error("There was an error creating the question:", error);
            throw error;
        }
    }

    /**
     * Create a game question within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} questionId - The ID of the question  
     * @param {string} managerId - The ID of the manager
     * @param {Object} data - The data of the question
     */
    async createQuestionTransaction(transaction, questionId, managerId, data) {
        try {
            const question = QuestionFactory.createGameQuestion(this.questionType, { ...data, id: questionId, type: this.questionType, managedBy: managerId });
            const createData = await super.createTransaction(transaction, question.toObject(), questionId);
            return QuestionFactory.createGameQuestion(this.questionType, createData);
        } catch (error) {
            console.error("There was an error creating the question:", error);
            throw error;
        }
    }

    async deleteQuestion(questionId) {
        try {
            await runTransaction(firestore, async (transaction) => {
                await this.deleteQuestionTransaction(transaction, questionId);
            });
        } catch (error) {
            console.error("There was an error deleting the question:", error);
            throw error;
        }
    }

    /**
     * Delete a game question within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} questionId - The ID of the question
     */
    async deleteQuestionTransaction(transaction, questionId) {
        try {
            await super.deleteTransaction(transaction, questionId);
        } catch (error) {
            console.error("There was an error deleting the question:", error);
            throw error;
        }
    }


    /**
     * Update a game question
     * @param {string} questionId - The ID of the question
     * @param {Object} data - The data of the question
     */
    async updateQuestion(questionId, data) {
        const updateData = await super.update(questionId, data);
        return updateData ? QuestionFactory.createGameQuestion(this.questionType, updateData) : null;
    }

    /**
     * Update a game question transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} questionId - The ID of the question
     * @param {Object} data - The data of the question
     */
    async updateQuestionTransaction(transaction, questionId, data) {
        const updateData = await super.updateTransaction(transaction, questionId, data);
        return updateData ? QuestionFactory.createGameQuestion(this.questionType, updateData) : null;
    }

    /**
     * Set a game question
     * @param {string} questionId - The ID of the question
     * @param {Object} data - The data of the question
     * @returns {GameQuestion}
     */
    async setQuestion(data, questionId = null) {
        const setData = await super.set(data, questionId);
        return setData ? QuestionFactory.createGameQuestion(this.questionType, setData) : null;
    }

    /**
     * Set a game question transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} questionId - The ID of the question
     * @param {Object} data - The data of the question
     * @returns {GameQuestion}
     */
    async setQuestionTransaction(transaction, questionId, data) {
        const setData = await super.setTransaction(transaction, questionId, data);
        return setData ? QuestionFactory.createGameQuestion(this.questionType, setData) : null;
    }


    async startQuestionTransaction(transaction, questionId) {
        await super.updateTransaction(transaction, questionId, {
            dateStart: serverTimestamp(),
        })
    }

    /**
     * Use a game question
     * @returns {GameQuestion}
     */
    useQuestion(questionId) {
        const { data, loading, error } = super.useDocument(questionId);
        return {
            gameQuestion: data ? QuestionFactory.createGameQuestion(this.questionType, data) : null,
            loading: loading,
            error: error
        };
    }

    /**
     * Use a game question once
     * @returns {GameQuestion}
     */
    useQuestionOnce(questionId) {
        const { data, loading, error } = super.useDocumentOnce(questionId);
        return {
            gameQuestion: data ? QuestionFactory.createGameQuestion(this.questionType, data) : null,
            loading: loading,
            error: error
        };
    }
} 