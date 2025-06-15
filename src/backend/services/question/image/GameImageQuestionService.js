import GameRiddleQuestionService from '@/backend/services/question/riddle/GameRiddleQuestionService';

export default class GameImageQuestionService extends GameRiddleQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
    }

}
