import RoundRepository from '@/backend/repositories/round/RoundRepository';

export default class BuzzerRoundRepository extends RoundRepository {
    
    constructor(gameId) {
        super(gameId);
    }

    /**
     * Get the current clue for a buzzer round
     * @param {string} roundId - The ID of the round
     * @returns {Promise<number>} The current clue index
     */
    async getCurrentClue(roundId) {
        const round = await this.getRound(roundId);
        return round?.currentClue || 0;
    }

    /**
     * Update the current clue for a buzzer round
     * @param {string} roundId - The ID of the round
     * @param {number} clueIndex - The new clue index
     * @returns {Promise<Round>} The updated round
     */
    async updateCurrentClue(roundId, clueIndex) {
        return this.updateRound(roundId, { currentClue: clueIndex });
    }

    /**
     * Get all clues for a buzzer round
     * @param {string} roundId - The ID of the round
     * @returns {Promise<string[]>} The clues
     */
    async getClues(roundId) {
        const round = await this.getRound(roundId);
        return round?.clues || [];
    }

    /**
     * Add a clue to a buzzer round
     * @param {string} roundId - The ID of the round
     * @param {string} clue - The clue to add
     * @returns {Promise<Round>} The updated round
     */
    async addClue(roundId, clue) {
        const round = await this.getRound(roundId);
        const clues = [...(round?.clues || []), clue];
        return this.updateRound(roundId, { clues });
    }
} 