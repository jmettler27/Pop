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

    async submitOrdering(questionId, playerId, teamId, ordering) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }

        if (!playerId) {
            throw new Error("No player ID has been provided!");
        }

        if (!teamId) {
            throw new Error("No team ID has been provided!");
        }

        if (!ordering) {
            throw new Error("No ordering has been provided!");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                console.log("Ordering submitted successfully", questionId, playerId, teamId, ordering)
            })
        }
        catch (error) {
            console.error("There was an error submitting the ordering:", error);
            throw error;
        }
    }
}

