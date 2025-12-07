import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { Player } from '@/backend/models/users/Player';
import { arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';


export default class GameLabellingQuestionRepository extends GameQuestionRepository {

    static LABELLING_PLAYERS_PATH = ['realtime', 'players'];

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.LABELLING);
    }

    async getPlayersTransaction(transaction, questionId) {
        const data = await this.getTransaction(transaction, [questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH]);
        // return data ? data.map(p => new Player(p)) : [];
        return data
    }

    async createQuestionTransaction(transaction, questionId, managerId, data) {
        await super.createQuestionTransaction(transaction, questionId, managerId, data);
        await this.createTransaction(transaction, { buzzed: [], canceled: [] }, [questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH]);
    }

    async resetPlayersTransaction(transaction, questionId) {
        await this.setTransaction(transaction, [questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH], { buzzed: [], canceled: [] });
    }

    async cancelPlayerTransaction(transaction, questionId, playerId) {
        await this.updateTransaction(transaction, [questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH], {
            canceled: arrayUnion({
                playerId,
                timestamp: Timestamp.now()
            }),
            buzzed: arrayRemove(playerId)
        });
    }

    // React hooks
    usePlayers(questionId) {
        const { data, loading, error } = this.useDocument([questionId, ...GameLabellingQuestionRepository.LABELLING_PLAYERS_PATH]);
        return {
            // players: data ? data.map(p => new Player(p)) : [],
            data,
            loading,
            error
        };
    }
} 