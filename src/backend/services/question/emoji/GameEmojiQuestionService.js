import GameRiddleQuestionService from "@/backend/services/round/riddle/RiddleRoundService";

export default class GameEmojiQuestionService extends GameRiddleQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
    }

}
