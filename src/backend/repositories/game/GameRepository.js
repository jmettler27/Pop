import GameFactory from '@/backend/models/games/GameFactory';

import FirebaseRepository from '@/backend/repositories/FirebaseRepository';
import { arrayUnion } from 'firebase/firestore';


export default class GameRepository extends FirebaseRepository {
    
    constructor() {
        super('games');
    }

    async getAllGames() {
        const data = await super.getAll();
        return data.map(g => GameFactory.createGame(g.type, g));
    }

    async createGame(data, gameId = null) {
        const createData = await super.create(data, gameId);
        return GameFactory.createGame(data.type, createData);
    }

    async updateGame(gameId, data) {
        return super.update(gameId, data);
    }

    async updateGameTransaction(transaction, gameId, data) {
        return super.updateTransaction(transaction, gameId, data);
    }

    async updateGameStatusTransaction(transaction, gameId, status) {
        return super.updateTransaction(transaction, gameId, { status });
    }

    async getGame(gameId) {
        const data = await super.get(gameId);
        return data ? GameFactory.createGame(data.type, data) : null;
    }

    async getGameTransaction(transaction, id) {
        const data = await super.getTransaction(transaction, id);
        return data ? GameFactory.createGame(data.type, data) : null;
    }
    
    async createGameTransaction(transaction, data) {

    }

    async addRoundTransaction(transaction, gameId, roundId) {
        await this.updateTransaction(transaction, gameId, {
            rounds: arrayUnion(roundId)
        });
    }

    // React hooks for real-time operations
    useGame(id) {
        const { data, loading, error } = super.useDocument(id);
        return {
            game: data ? GameFactory.createGame(data.type, data) : null,
            loading,
            error
        };
    }

    useGameOnce(id) {
        const { data, loading, error } = super.useDocumentOnce(id);
        return {
            game: data ? GameFactory.createGame(data.type, data) : null,
            loading,
            error
        };
    }

    useAllGames() {
        const { data, loading, error } = super.useCollection();
        return {
            games: data.map(g => GameFactory.createGame(g.type, g)),
            loading,
            error
        };
    }

    useGamesByStatus(status) {
        const { data, loading, error } = super.useCollection({
            where: {
                field: 'status',
                operator: '==',
                value: status
            }
        })
        return {
            games: data.map(g => GameFactory.createGame(g.type, g)),
            loading,
            error
        };
    }

    useGamesByCreator(creatorId) {
        const { data, loading, error } = super.useCollection({
            where: {
                field: 'createdBy',
                operator: '==',
                value: creatorId
            }
        })
        return {
            games: data.map(g => GameFactory.createGame(g.type, g)),
            loading,
            error
        };
    }

} 