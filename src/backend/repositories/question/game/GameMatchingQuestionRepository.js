import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { MatchingQuestion } from '@/backend/models/questions/MatchingQuestion';
import { Timestamp } from 'firebase/firestore';

export default class GameMatchingQuestionRepository extends GameQuestionRepository {

    static CORRECT_MATCHES_PATH = ['realtime', 'correct'];
    static INCORRECT_MATCHES_PATH = ['realtime', 'incorrect'];
    static PARTIALLY_CORRECT_MATCHES_PATH = ['realtime', 'partiallyCorrect'];

    constructor(gameId, roundId) {
        super(gameId, roundId, QuestionType.MATCHING);
    }

    async getCorrectMatchesTransaction(transaction, questionId) {
        const data = await this.getTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]);
        return data ? data.correctMatches : [];
    }

    async addCorrectMatchTransaction(transaction, questionId, matchIdx, userId, teamId) {
        await this.updateTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH],
            { 
                correctMatches: arrayUnion({
                    matchIdx,
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                }) 
            }
        );
    }

    async getPartiallyCorrectMatchesTransaction(transaction, questionId) {
        const data = await this.getTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH]);
        return data ? data.partiallyCorrectMatches : [];
    }

    async addPartiallyCorrectMatchTransaction(transaction, questionId, colIndices, matchIdx, userId, teamId) {
        await this.updateTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH],
            { 
                partiallyCorrectMatches: arrayUnion({
                    colIndices,
                    matchIdx,
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                }) 
            }
        );
    }

    async getIncorrectMatchesTransaction(transaction, questionId) {
        const data = await this.getTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]);
        return data ? data.incorrectMatches : [];
    }

    async addIncorrectMatchTransaction(transaction, questionId, match, userId, teamId) {
        await this.updateTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH],
            { 
                incorrectMatches: arrayUnion({
                    match,
                    userId,
                    teamId,
                    timestamp: Timestamp.now(),
                }) 
            }
        );
    }

    async createQuestionTransaction(transaction, questionId, managerId, data) {
        await super.createQuestionTransaction(transaction, questionId, managerId, data);

        await this.createTransaction(transaction, { correctMatches: {} },  [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]);
        await this.createTransaction(transaction, { incorrectMatches: {} }, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]);
        await this.createTransaction(transaction, { partiallyCorrectMatches: {} }, [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH]);
    }

    async deleteQuestionTransaction(transaction, questionId) {
        await super.deleteQuestionTransaction(transaction, questionId);
        await this.deleteTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]);
        await this.deleteTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]);
        await this.deleteTransaction(transaction, [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH]);
    }

    async resetQuestionTransaction(transaction, questionId) {
        await this.updateQuestionTransaction(transaction, questionId, {
            teamNumMistakes: {},
            canceled: [],
        })
        await this.setTransaction(transaction, { correctMatches: [] }, [questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]);
        await this.setTransaction(transaction, { incorrectMatches: [] }, [questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]);
        await this.setTransaction(transaction, { partiallyCorrectMatches: [] }, [questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH]);
    }

    // React hooks
    useCorrectMatches(questionId) {
        const { data, loading, error } = this.useDocument([questionId, ...GameMatchingQuestionRepository.CORRECT_MATCHES_PATH]);
        return {
            correctMatches: data ? data.correctMatches : [],
            loading,
            error
        };
    }

    useIncorrectMatches(questionId) {
        const { data, loading, error } = this.useDocument([questionId, ...GameMatchingQuestionRepository.INCORRECT_MATCHES_PATH]);
        return {
            incorrectMatches: data ? data.incorrectMatches : [],
            loading,
            error
        };
    }

    usePartiallyCorrectMatches(questionId) {
        const { data, loading, error } = this.useDocument([questionId, ...GameMatchingQuestionRepository.PARTIALLY_CORRECT_MATCHES_PATH]);
        return {
            partiallyCorrectMatches: data ? data.partiallyCorrectMatches : [],
            loading,
            error
        };
    }

    useIsCanceled(questionId, teamId) {
        const { gameQuestion, loading, error } = this.useQuestion(questionId)
                
        if (loading || error) {
            return {
                isCanceled: false,
                loading: loading,
                error: error
            }
        }

        return {
            isCanceled: gameQuestion.teamNumMistakes[teamId] >= MatchingQuestion.MAX_NUM_MISTAKES,
            loading,
            error
        }
    }

} 