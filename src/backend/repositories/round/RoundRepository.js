import FirebaseRepository from '@/backend/repositories/FirebaseRepository';

import RoundFactory from '@/backend/models/rounds/RoundFactory';

import { serverTimestamp, arrayUnion } from 'firebase/firestore';

export default class RoundRepository extends FirebaseRepository {
    
    constructor(gameId) {
        super(['games', gameId, 'rounds']);
    }

    /**
     * Get a round by ID
     * @param {string} roundId - The ID of the round
     * @returns {Promise<Round>} The round
     */
    async getRound(roundId) {
        const data = await super.get(roundId);
        return data ? RoundFactory.createRound(data.type, data) : null;
    }

    /**
     * Get a round by ID within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} roundId - The ID of the round
     * @returns {Promise<Round>} The round
     */
    async getRoundTransaction(transaction, roundId) {
        const data = await super.getTransaction(transaction, roundId);
        return data ? RoundFactory.createRound(data.type, data) : null;
    }

    /**
     * Get all rounds
     * @returns {Promise<Round[]>} The rounds
     */
    async getAllRounds() {
        const data = await super.getAll();
        return data.map(r => RoundFactory.createRound(r.type, r));
    }

    async getRoundsTransaction(transaction, queryOptions) {
        const data = await super.getByQueryTransaction(transaction, queryOptions);
        return data.map(r => RoundFactory.createRound(r.type, r));
    }

    /**
     * Create a round
     * @param {string} roundType - The type of the round
     * @param {Object} data - The data of the round
     * @returns {Promise<Round>} The round
     */
    async createRound(roundType, data) {
        try {
            const round = RoundFactory.createRound(roundType, {...data, type: roundType});
            const createData = await super.create(round.toObject());
            return RoundFactory.createRound(roundType, createData);
        } catch (error) {
            console.error("There was an error creating the round:", error);
            throw error;
        }
    }

    /**
     * Create a round within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} roundType - The type of the round
     * @param {Object} data - The data of the round
     * @returns {Promise<Round>} The round
     */
    async createRoundTransaction(transaction, roundType, data) {
        try {
            const round = RoundFactory.createRound(roundType, data);
            const roundData = await super.createTransaction(transaction, round.toObject());
            return RoundFactory.createRound(roundType, roundData);
        } catch (error) {
            console.error("There was an error creating the round:", error);
            throw error;
        }
    }

    /**
     * Update a round
     * @param {string} roundId - The ID of the round
     * @param {Object} data - The data of the round
     * @returns {Promise<Round>} The round
     */
    async updateRound(roundId, data) {
        const roundData = await super.update(roundId, data);
        return RoundFactory.createRound(roundData.type, roundData);
    }

    /**
     * Update a round within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} roundId - The ID of the round
     * @param {Object} data - The data of the round
     * @returns {Promise<Round>} The round
     */
    async updateRoundTransaction(transaction, roundId, data) {
        const roundData = await super.updateTransaction(transaction, roundId, data);
        return RoundFactory.createRound(roundData.type, roundData);
    }

    /**
     * Add a question to a round within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} roundId - The ID of the round
     * @param {string} questionId - The ID of the question
     */
    async addGameQuestionTransaction(transaction, roundId, questionId) {
        await super.updateTransaction(transaction, roundId, {
            questions: arrayUnion(questionId)
        });
    }

    /**
     * Start a round within a transaction
     * @param {Transaction} transaction - The transaction
     * @param {string} roundId - The ID of the round
     */
    async startRoundTransaction(transaction, roundId) {
        await super.updateTransaction(transaction, roundId, {
            dateStart: serverTimestamp()
        });
    }

    // React hooks for real-time operations
    /**
     * Get a round by ID
     * @param {string} roundId - The ID of the round
     * @returns {Promise<Round>} The round
     */
    useRound(roundId) {
        const { data, loading, error } = super.useDocument(roundId);
        return {
            round: data ? RoundFactory.createRound(data.type, data) : null,
            loading,
            error
        };
    }

    /**
     * Get a round by ID once
     * @param {string} roundId - The ID of the round
     * @returns {Promise<Round>} The round
     */
    useRoundOnce(roundId) {
        const { data, loading, error } = super.useDocumentOnce(roundId);
        return {
            round: data ? RoundFactory.createRound(data.type, data) : null,
            loading,
            error
        };
    }

    /**
     * Get all rounds
     * @returns {Promise<Round[]>} The rounds
     */
    useAllRounds() {
        const { data, loading, error } = super.useCollection();
        return {
            rounds: data.map(r => RoundFactory.createRound(r.type, r)),
            loading,
            error
        };
    }

    useRoundsOnce(queryOptions = {}) {
        const { data, loading, error } = super.useCollectionOnce(queryOptions);
        return {
            rounds: data.map(r => RoundFactory.createRound(r.type, r)),
            loading,
            error
        };
    }
        
} 