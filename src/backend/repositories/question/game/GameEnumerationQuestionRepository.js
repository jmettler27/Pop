import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { Player } from '@/backend/models/users/Player';

export default class GameEnumerationQuestionRepository extends GameQuestionRepository {

    static ENUMERATION_PLAYERS_PATH = ['realtime', 'players'];

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.ENUMERATION);
    }

    // Firestore operations
    async getPlayersTransaction(transaction, questionId) {
        const data = await this.getTransaction(transaction, [questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH]);
        // return data ? data.map(p => new Player(p)) : [];
        return data
    }

    // React hooks
    usePlayers(questionId) {
        const { data, loading, error } = this.useDocument([questionId, ...GameEnumerationQuestionRepository.ENUMERATION_PLAYERS_PATH]);
        return {
            // players: data ? data.map(p => new Player(p)) : [],
            data,
            loading,
            error
        };
    }
} 