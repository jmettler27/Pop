import GameQuestionService from "@/backend/services/question/GameQuestionService";


export default class GameReorderingQuestionService extends GameQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.REORDERING);
    }

    async resetQuestionTransaction(transaction, questionId) {
        await super.resetQuestionTransaction(transaction, questionId);

        console.log("Reordering question successfully reset", questionId);
    }

    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId);

        console.log("Reordering question successfully ended", questionId);
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        await super.handleCountdownEndTransaction(transaction, questionId);

        console.log("Reordering question countdown end successfully handled", questionId);
    }

    /* ============================================================================================================ */

    
}

