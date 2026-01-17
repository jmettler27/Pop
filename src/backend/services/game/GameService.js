import {firestore} from '@/backend/firebase/firebase';
import {runTransaction, serverTimestamp} from 'firebase/firestore';

import GameRepository from '@/backend/repositories/game/GameRepository';
import TimerRepository from '@/backend/repositories/timer/TimerRepository';
import SoundRepository from '@/backend/repositories/sound/SoundRepository';
import ChooserRepository from '@/backend/repositories/user/ChooserRepository';
import ReadyRepository from '@/backend/repositories/user/ReadyRepository';
import GameScoreRepository from '@/backend/repositories/score/GameScoreRepository';
import TeamRepository from '@/backend/repositories/user/TeamRepository';
import {PlayerStatus} from '@/backend/models/users/Player';
import {GameStatus} from '@/backend/models/games/GameStatus';

import {getRandomElement, shuffle} from '@/backend/utils/arrays';
import PlayerRepository from "@/backend/repositories/user/PlayerRepository";
import OrganizerRepository from "@/backend/repositories/user/OrganizerRepository";
import {TimerStatus} from "@/backend/models/Timer";


export default class GameService {

    constructor(gameId) {
        if (!gameId) {
            throw new Error("No game ID has been provided!");
        }

        this.gameId = gameId;

        this.gameRepo = new GameRepository();
        this.soundRepo = new SoundRepository(gameId);
        this.chooserRepo = new ChooserRepository(gameId);
        this.timerRepo = new TimerRepository(gameId);
        this.readyRepo = new ReadyRepository(gameId);
        this.gameScoreRepo = new GameScoreRepository(gameId);
        this.teamRepo = new TeamRepository(gameId);
        this.playerRepo = new PlayerRepository(gameId);
        this.organizerRepo = new OrganizerRepository(gameId);

    }

    // game_start -> game_home
    /**
     * Starts a game
     */
    async startGame() {
        try {
            await runTransaction(firestore, async (transaction) => {
                const teams = await this.teamRepo.getAllTransaction(transaction)

                const {teamIds, initTeamGameScores, initTeamGameScoresProgress} = teams.reduce((acc, team) => {
                    acc.teamIds.push(team.id);
                    acc.initTeamGameScores[team.id] = 0;
                    acc.initTeamGameScoresProgress[team.id] = {};
                    return acc;
                }, {teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {}});

                const shuffledTeamIds = shuffle(teamIds)
                const chooserTeamId = shuffledTeamIds[0]

                await this.playerRepo.updateTeamAndOtherTeamsPlayersStatusTransaction(transaction, chooserTeamId, PlayerStatus.FOCUS, PlayerStatus.IDLE)

                await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
                    status: GameStatus.GAME_HOME,
                    dateStart: serverTimestamp(),
                })

                await this.chooserRepo.initializeChoosersTransaction(transaction, shuffledTeamIds)

                await this.gameScoreRepo.initializeScoresTransaction(transaction, {
                    scores: initTeamGameScores,
                    scoresProgress: initTeamGameScoresProgress,
                })

                await this.readyRepo.updateReadyTransaction(transaction, {
                    numReady: 0,
                })

                await this.soundRepo.addSoundTransaction(transaction, 'ui-confirmation-alert-b2')

                await this.timerRepo.resetTimerTransaction(transaction)

                console.log("Game successfully started.", "game", this.gameId);
            });
        } catch (error) {
            console.error("There was an error starting the game:", error);
            throw error;
        }
    }

    async resetGame() {
        try {
            await runTransaction(firestore, async (transaction) => {
                const teams = await this.teamRepo.getAllTransaction(transaction)
                const players = await this.playerRepo.getAllPlayersTransaction(transaction)
                const organizers = await this.organizerRepo.getAllOrganizersTransaction(transaction)

                const {teamIds, initTeamGameScores, initTeamGameScoresProgress} = teams.reduce((acc, team) => {
                    acc.teamIds.push(team.id);
                    acc.initTeamGameScores[team.id] = 0;
                    acc.initTeamGameScoresProgress[team.id] = {};
                    return acc;
                }, {teamIds: [], initTeamGameScores: {}, initTeamGameScoresProgress: {}});

                // Reset all rounds - assuming a method exists in gameRepo
                await this.gameRepo.resetAllRoundsTransaction(transaction, this.gameId)

                // Reset game
                await this.gameRepo.updateGameTransaction(transaction, this.gameId, {
                    currentRound: null,
                    currentQuestion: null,
                    dateEnd: null,
                    dateStart: null,
                    status: GameStatus.GAME_START,
                })

                // Reset timer
                const managerId = getRandomElement(organizers)
                await this.timerRepo.updateTransaction(transaction, {
                    status: TimerStatus.RESET,
                    duration: 60,
                    forward: false,
                    authorized: false,
                    managedBy: managerId,
                })

                // Init chooser
                const shuffledTeamIds = shuffle(teamIds)
                await this.chooserRepo.updateChooserTransaction(transaction, {
                    chooserIdx: 0,
                    chooserOrder: shuffledTeamIds
                })

                // Init global scores
                await this.gameScoreRepo.initializeScoresTransaction(transaction, {
                    scores: initTeamGameScores,
                    scoresProgress: initTeamGameScoresProgress,
                })

                await this.readyRepo.updateTransaction(transaction, {
                    numPlayers: players.length,
                    numReady: 0
                })

                await this.playerRepo.updateAllPlayersStatusTransaction(transaction, PlayerStatus.IDLE)
                await this.soundRepo.clearSoundsTransaction(transaction);

                console.log("Game successfully reset.", "game", this.gameId);
            });

        } catch (error) {
            console.error("There was an error resetting the game:", error);
            throw error;
        }
    }

    /**
     * Switch to the game home
     *
     * round_end_game_hone
     */
    async returnToGameHome() {

        try {
            await runTransaction(firestore, async (transaction) => {
                await this.soundRepo.addSoundTransaction(transaction, 'ui-confirmation-alert-b2')
                await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.GAME_HOME)

                console.log("Round end to game home successfully completed.", "game", this.gameId);
            });
        } catch (error) {
            console.error("Error round end to game home:", error);
            throw error;
        }
    }

    /**
     * Resume editing
     */
    async resumeEditing() {

        try {
            await runTransaction(firestore, async (transaction) => {
                await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.GAME_EDIT)

                console.log("Editing successfully resumed.", "game", this.gameId);
            });
        } catch (error) {
            console.error("Error resuming editing:", error);
            throw error;
        }
    }

    /**
     * End a game
     */
    async endGame() {

        try {
            await runTransaction(firestore, async (transaction) => {
                await this.gameRepo.updateGameStatusTransaction(transaction, this.gameId, GameStatus.GAME_END)

                console.log("Game successfully ended.", "game", this.gameId);
            });
        } catch (error) {
            console.error("Error ending game:", error);
            throw error;
        }
    }
}