import FirebaseDocumentRepository from '@/backend/repositories/FirebaseDocumentRepository';

export default class RoundScoreRepository extends FirebaseDocumentRepository {
    
    constructor(gameId, roundId) {
        super(['games', gameId, 'rounds', roundId, 'realtime', 'scores']);
    }

    async getScoresTransaction(transaction) {
        return await this.getTransaction(transaction);
    }

    async updateScoresTransaction(transaction, scores) {
        return await this.updateTransaction(transaction, scores);
    }

    async resetScoresTransaction(transaction) {
        return await this.updateTransaction(transaction, {
            scores: initTeamRoundScores,
            scoresProgress: {},
            teamsScoresSequences: {},
            roundSortedTeams: [],
            gameSortedTeams: []
        });
    }

    async initializeScoresTransaction(transaction) {
        return await this.setTransaction(transaction, {
            gameSortedTeams: [],
            rankingDiffs: {},
            roundSortedTeams: [],
            scores: {},
            scoresProgress: {},
        });
    }

    async increaseTeamScoreTransaction(transaction, questionId, teamId=null, points=0) {
        const roundScores = await this.getTransaction(transaction)
        const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScores
    
        const newRoundProgress = {}
        for (const tid of Object.keys(currentRoundScores)) {
            newRoundProgress[tid] = {
                ...currentRoundProgress[tid],
                [questionId]: currentRoundScores[tid] + (tid === teamId) * points
            }
        }

        await this.updateTransaction(transaction, {
            [`scores.${teamId}`]: increment(points),
            scoresProgress: newRoundProgress
        })
    }

    // React hooks for real-time operations
    useScores() {
        const { data, loading, error } = super.useDocument();
        return { roundScores: data, loading, error };
    }

    useScoresOnce() {
        const { data, loading, error } = super.useDocumentOnce();
        return { roundScores: data, loading, error };
    }
} 