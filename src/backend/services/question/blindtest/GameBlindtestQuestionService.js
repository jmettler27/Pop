import GameRiddleQuestionService from '@/backend/services/question/riddle/GameRiddleQuestionService';

export default class GameBlindtestQuestionService extends GameRiddleQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
    }

}
