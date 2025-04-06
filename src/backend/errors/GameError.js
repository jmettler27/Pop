export class GameError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GameError';
    this.code = code;
  }
}

export class GameNotFoundError extends GameError {
  constructor() {
    super('Game not found', 'GAME_NOT_FOUND');
    this.name = 'GameNotFoundError';
  }
}

export class InvalidGameStateError extends GameError {
  constructor(currentState, expectedState) {
    super(`Invalid game state. Current: ${currentState}, Expected: ${expectedState}`, 'INVALID_GAME_STATE');
    this.name = 'InvalidGameStateError';
    this.currentState = currentState;
    this.expectedState = expectedState;
  }
} 