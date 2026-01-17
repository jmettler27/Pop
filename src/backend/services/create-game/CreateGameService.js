import { firestore } from "@/backend/firebase/firebase";
import { runTransaction } from "firebase/firestore";

import GameRepository from "@/backend/repositories/game/GameRepository";
import TimerRepository from "@/backend/repositories/timer/TimerRepository";
import ChooserRepository from "@/backend/repositories/user/ChooserRepository";
import GameScoreRepository from "@/backend/repositories/score/GameScoreRepository";
import OrganizerRepository from "@/backend/repositories/user/OrganizerRepository";
import ReadyRepository from "@/backend/repositories/user/ReadyRepository";
import SoundRepository from "@/backend/repositories/sound/SoundRepository";

/**
 * Service for creating a new game
 */
export default class CreateGameService {

    /**
     * Creates a new game
     * 
     * @param {Object} data - The data of the game
     * 
     * @returns {Promise<Object>} The game
     */
    constructor() {
        this.gameRepo = new GameRepository();
    }

    /**
     * Creates a new game
     * 
     * @param {Object} data - The data of the game
     * 
     * @returns {Promise<Object>} The game
     */
    async createGame(data) {
        if (!data) {
            throw new Error("Data is required");
        }

        try {
            await runTransaction(firestore, async (transaction) => {
                const {
                    title,
                    type,
                    lang,
                    maxPlayers,
                    roundScorePolicy,
                    organizerName,
                    organizerId,
                    organizerImage
                } = data;
        
                    const game = await this.gameRepo.createGameTransaction(transaction, data);
                    const gameId = game.id;

                    const organizerRepo = new OrganizerRepository(gameId);
                    await organizerRepo.createOrganizerTransaction(transaction, organizerId, organizerName, organizerImage);
                    
                    const readyRepo = new ReadyRepository(gameId);
                    await readyRepo.initializeReadyTransaction(transaction);
        
                    const scoreRepo = new GameScoreRepository(gameId);
                    await scoreRepo.initializeScoresTransaction(transaction);
        
                    const chooserRepo = new ChooserRepository(gameId);
                    await chooserRepo.createChooserTransaction(transaction);
        
                    const timerRepo = new TimerRepository(gameId);
                    await timerRepo.initializeTimerTransaction(transaction, organizerId);
        
                    const soundRepo = new SoundRepository(gameId);
                    await soundRepo.initializeSoundsTransaction(transaction);

                    console.log("Game created successfully.", "gameId: ", gameId);
                    return gameId;
            });
        } catch (error) {
            console.error("Error creating game:", error);
            throw error;
        }
    }
}
