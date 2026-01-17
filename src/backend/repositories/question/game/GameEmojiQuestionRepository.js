import GameBuzzerQuestionRepository from "@/backend/repositories/question/game/GameBuzzerQuestionRepository";

import { QuestionType } from "@/backend/models/questions/QuestionType";

export default class GameEmojiQuestionRepository extends GameBuzzerQuestionRepository {
    
    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.EMOJI);
    }

}