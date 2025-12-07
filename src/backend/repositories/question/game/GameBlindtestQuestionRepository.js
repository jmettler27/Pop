import GameRiddleQuestionRepository from "@/backend/repositories/question/game/GameRiddleQuestionRepository";

import { QuestionType } from "@/backend/models/questions/QuestionType";

export default class GameBlindtestQuestionRepository extends GameRiddleQuestionRepository {
    
    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.BLINDTEST);
    }

}