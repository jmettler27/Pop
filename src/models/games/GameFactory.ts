import { GameRandom, GameRounds, type GameData } from '@/models/games/game';
import { GameType } from '@/models/games/game-type';

export default class GameFactory {
  static createGame(type: GameType, data: GameData): GameRounds {
    switch (type) {
      case GameType.ROUNDS:
        return new GameRounds(data);
      default:
        throw new Error(`Unknown game type: ${String(type)}`);
    }
  }
}
