import GameRiddleQuestionService from "@/backend/services/round/riddle/RiddleRoundService";

export default class GameImageQuestionService extends GameRiddleQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
    }

}
