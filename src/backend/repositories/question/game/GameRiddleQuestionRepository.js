import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { Player } from '@/backend/models/users/Player';
import { Timestamp } from 'firebase/firestore';
import { arrayUnion, arrayRemove } from 'firebase/firestore';


export default class GameRiddleQuestionRepository extends GameQuestionRepository {

    static RIDDLE_PLAYERS_PATH = ['realtime', 'players'];

    constructor(gameId, roundId, questionType) {
        super(gameId, roundId, questionType);
    }

    // Firestore operations
    async getPlayersTransaction(transaction, questionId) {
        const data = await this.getTransaction(transaction, [questionId, ...GameRiddleQuestionRepository.RIDDLE_PLAYERS_PATH]);
        return data ? data.map(p => new Player(p)) : [];
    }

    async createQuestionTransaction(transaction, questionId, managerId, data) {
        await super.createQuestionTransaction(transaction, questionId, managerId, data);

        await this.createTransaction(transaction, 
            { buzzed: [], canceled: [] }, 
            [questionId, ...GameRiddleQuestionRepository.RIDDLE_PLAYERS_PATH]
        );
    }

    async updateQuestionWinnerTransaction(transaction, questionId, playerId, teamId) {
        await this.updateQuestionTransaction(transaction, questionId, { 
            winner: { playerId, teamId } 
        });
    }

    async updatePlayersTransaction(transaction, questionId, players) {
        await this.updateTransaction(transaction, 
            [questionId, ...GameRiddleQuestionRepository.RIDDLE_PLAYERS_PATH], 
            players
        );
    }


    async resetPlayersTransaction(transaction, questionId) {
        await this.setTransaction(transaction, 
            [questionId, ...GameRiddleQuestionRepository.RIDDLE_PLAYERS_PATH], 
            { buzzed: [], canceled: [] }
        );
    }

    async cancelPlayerTransaction(transaction, questionId, playerId, clueIdx) {
        await this.updatePlayersTransaction(transaction, questionId, 
            {
                canceled: arrayUnion({
                    clueIdx,
                    playerId,
                    timestamp: Timestamp.now()
                }),
                buzzed: arrayRemove(playerId)
            }
        );
    }

    async addPlayerToBuzzerTransaction(transaction, questionId, playerId) {
        await this.updatePlayersTransaction(transaction, questionId, 
            { buzzed: arrayUnion(playerId) }
        );
    }

    async removePlayerFromBuzzerTransaction(transaction, questionId, playerId) {
        await this.updatePlayersTransaction(transaction, questionId, 
            { buzzed: arrayRemove(playerId) }
        );
    }

    async clearBuzzerTransaction(transaction, questionId) {
        await this.updatePlayersTransaction(transaction, questionId, 
            { buzzed: [] }
        );
    }

    // React hooks
    usePlayers(questionId) {
        const { data, loading, error } = this.useDocument([questionId, ...GameRiddleQuestionRepository.RIDDLE_PLAYERS_PATH]);
        return {
            // players: data ? data.map(p => new Player(p)) : [],
            data,
            loading,
            error
        };
    }
} 