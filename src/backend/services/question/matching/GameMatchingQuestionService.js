import GameQuestionService from '@/backend/services/question/GameQuestionService';

import ChooserRepository from '@/backend/repositories/user/ChooserRepository';

import { ScorePolicyType } from '@/backend/models/ScorePolicy';

import { findNextAvailableChooser } from '@/backend/utils/arrays';

import { getDocs, query, where } from 'firebase/firestore';
import { PlayerStatus } from '@/backend/models/users/Player';
import { GameMatchingQuestion } from '@/backend/models/questions/Matching';


export class GameMatchingQuestionService extends GameQuestionService {

    constructor(gameId, roundId) {
        super(gameId, roundId);
        
        this.chooserRepo = new ChooserRepository(gameId);
    }

    async resetQuestionTransaction(transaction, questionId) {
        const chooser = await this.chooserRepo.resetChoosersTransaction(transaction)
        
        await this.gameQuestionRepo.resetQuestionTransaction(transaction, questionId)
        await this.playerRepo.updateTeamPlayersStatusTransaction(transaction, chooser.teamId, PlayerStatus.IDLE)
        
        await super.resetQuestionTransaction(transaction, questionId)

        console.log("Matching question successfully reset", questionId)
    }

    async handleCountdownEndTransaction(transaction, questionId) {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const correctMatches = await this.gameQuestionRepo.getCorrectMatchesTransaction(transaction, questionId);
        const incorrectMatches = await this.gameQuestionRepo.getIncorrectMatchesTransaction(transaction, questionId);

        const correctMatchIndices = correctMatches.map(obj => obj.matchIdx)
        const incorrectMatch = incorrectMatches.map(obj => obj.match)
        const match = GameMatchingQuestion.generateMatch(baseQuestion.numRows, baseQuestion.numCols, incorrectMatch, correctMatchIndices);
    
        await this.submitMatchTransaction(transaction, questionId, 'system', null, match)

        console.log("Matching question countdown end successfully handled", questionId)
        
    }

    async endQuestionTransaction(transaction, questionId) {
        await super.endQuestionTransaction(transaction, questionId)

        console.log("Matching question successfully ended", questionId)
    }

    /* ============================================================================================================ */

    async revealLabel(questionId, userId, edges, match) {
        if (!questionId) {
            throw new Error("No question ID has been provided!");
        }
        if (!userId) {
            throw new Error("No user ID has been provided!");
        }
        if ((!edges || edges.length === 0) && (!match || match.length === 0)) {
            throw new Error("No edges nor rows have been provided!");
        }
    
        try {
            await runTransaction(firestore, transaction => submitMatchTransaction(transaction, questionId, userId, edges, match))
        } catch (error) {
            console.error("There was an error handling the matching submission:", error);
            throw error;
        }
    }

    async revealLabelTransaction(transaction, questionId, userId, edges, match) {
        const { chooserOrder, chooserIdx } = await this.chooserRepo.getChooserTransaction(transaction, this.gameId)
        const teamId = chooserOrder[chooserIdx]

        // edges is an array of numCols objects of the form {from: origRow0_col0, to: origRow1_col1}
        const rows = match || edges.flatMap((edge, idx) => {
            const fromNumericPart = parseInt(edge.from.match(/\d+/)[0]);
            const toNumericPart = parseInt(edge.to.match(/\d+/)[0]);
            return (idx === 0) ?
                [fromNumericPart, toNumericPart] :
                [toNumericPart]
        });

        const isCorrect = rows.every(row => row === rows[0])

        if (isCorrect) {
            // Case 1: The matching is correct
            await this.handleCorrectMatchTransaction(transaction, questionId, userId, teamId, rows)
        } else {
            // Case 2: The matching is incorrect
            await this.handleIncorrectMatchTransaction(transaction, questionId, userId, teamId, rows)
        }
        // await updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)
        console.log("Matching submission handled successfully.")
    }


    async validateAllLabels(questionId, playerId) {
        await this.gameQuestionRepo.validateAllLabelsTransaction(transaction, questionId, playerId)
    }

    async cancelPlayer(questionId, playerId, wholeTeam = false) {
        await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, playerId, wholeTeam)
    }
}
