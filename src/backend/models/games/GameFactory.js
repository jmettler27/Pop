import { GameRandom, GameRounds } from '@/backend/models/games/Game';
import { GameType } from '@/backend/models/games/GameType';

export default class GameFactory {

    /**
     * Create a game
     * @param {string} type - The type of the game
     * @param {Object} data - The data of the game
     * @returns {Game} The game
     */
    static createGame(type, data) {
        switch (type) {
            case GameType.RANDOM:
                return new GameRandom(data);
            case GameType.ROUNDS:
                return new GameRounds(data);
            default:
                throw new Error(`Unknown game type: ${type}`);
        }
    }
}

