import { GameService } from '@/backend/services/game/GameService';
import { GameNotFoundError, InvalidGameStateError } from '@/backend/errors/GameError';
import { GAME_STATES } from '@/backend/constants';

describe('GameService', () => {
  let gameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  describe('createGame', () => {
    it('should create a new game with default settings', async () => {
      const game = await gameService.createGame();
      expect(game).toBeDefined();
      expect(game.state).toBe(GAME_STATES.LOBBY);
    });
  });

  describe('startGame', () => {
    it('should throw GameNotFoundError if game does not exist', async () => {
      await expect(gameService.startGame('non-existent-id')).rejects.toThrow(GameNotFoundError);
    });

    it('should throw InvalidGameStateError if game is not in LOBBY state', async () => {
      const game = await gameService.createGame();
      await gameService.updateGameState(game.id, GAME_STATES.PLAYING);

      await expect(gameService.startGame(game.id)).rejects.toThrow(InvalidGameStateError);
    });
  });
});
