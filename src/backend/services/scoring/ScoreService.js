import { firestore } from '@/backend/firebase/firebase';
import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, collection, query, getDocs, where, runTransaction, increment } from 'firebase/firestore';

import Game from '@/backend/models/games/Game';

import { getDocDataTransaction } from '@/backend/services/utils';

import RoundScoreRepository from '@/backend/repositories/scoring/RoundScoreRepository';
import GameScoreRepository from '@/backend/repositories/scoring/GameScoreRepository';


export default class ScoreService {

    constructor() {
        this.roundScoreRepo = new RoundScoreRepository();
        this.gameScoreRepo = new GameScoreRepository();
    }

    async initRoundScores(gameId, roundId) {
        const initTeamRoundScores = await this.getInitTeamScores(gameId);
        await this.updateRoundScores(gameId, roundId, {
            scores: initTeamRoundScores,
            scoresProgress: {},
            teamsScoresSequences: {},
            roundSortedTeams: [],
            gameSortedTeams: []
        });
    }

    async increaseRoundTeamScore(gameId, roundId, questionId, teamId, points) {
        if (!gameId) {
            throw new Error("Missing required parameters");
        }
        if (!roundId) {
            throw new Error("Missing required parameters");
        }
        if (!questionId) {
            throw new Error("Missing required parameters");
        }
        if (!teamId) {
            throw new Error("Missing required parameters");
        }

        try {
            await runTransaction(firestore, transaction =>
                this.increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points)
            );
        } catch (error) {
            console.error("Error increasing team score:", error);
            throw error;
        }
    }

    async increaseRoundTeamScoreTransaction(transaction, gameId, roundId, questionId, teamId, points) {
        const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');
        const roundScoresData = await getDocDataTransaction(transaction, roundScoresRef);

        const { scores: currentRoundScores, scoresProgress: currentRoundProgress } = roundScoresData;

        // Update progress for all teams
        const newRoundProgress = {};
        for (const tid of Object.keys(currentRoundScores)) {
            newRoundProgress[tid] = {
                ...currentRoundProgress[tid],
                [questionId]: currentRoundScores[tid] + (tid === teamId) * points
            };
        }

        // Update scores
        transaction.update(roundScoresRef, {
            [`scores.${teamId}`]: increment(points),
            scoresProgress: newRoundProgress
        });
    }

    // Private methods
    async getInitTeamScores(gameId) {
        const teamsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'teams');
        const teamsSnapshot = await getDocs(query(teamsCollectionRef));
        
        const initTeamScores = {};
        teamsSnapshot.docs.forEach(doc => {
            initTeamScores[doc.id] = 0;
        });
        
        return initTeamScores;
    }

    async updateRoundScores(gameId, roundId, scoresData) {
        const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');
        await runTransaction(firestore, transaction => {
            transaction.set(roundScoresRef, scoresData);
        });
    }



    async calculateRoundCompletionRates(gameId, roundId) {
        const gameRef = doc(GAMES_COLLECTION_REF, gameId);
        const roundRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId);
        const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores');

        const [gameData, roundData, roundScoresData] = await Promise.all([
            getDocDataTransaction(null, gameRef),
            getDocDataTransaction(null, roundRef),
            getDocDataTransaction(null, roundScoresRef)
        ]);

        const game = new Game(gameData);
        const round = game.getCurrentRound();
        const { scores: roundScores } = roundScoresData;

        // Calculate completion rates based on round type
        const completionRates = {};
        const maxPoints = round.getMaxPoints();

        Object.entries(roundScores).forEach(([teamId, score]) => {
            completionRates[teamId] = maxPoints > 0 ? Math.round(100 * score / maxPoints) : 0;
        });

        return completionRates;
    }
} 