import { QuestionType } from "@/backend/models/questions/QuestionType";
import GameRiddleQuestionRepository from "@/backend/repositories/question/game/GameRiddleQuestionRepository";

import { increment } from "firebase/database";

export default class GameProgressiveCluesQuestionRepository extends GameRiddleQuestionRepository {
    
    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.PROGRESSIVE_CLUES);
    }

    async incrementClueTransaction(transaction, questionId) {
        await this.updateQuestionTransaction(transaction, questionId, {
            currentClueIdx: increment(1)
        });
    }

}