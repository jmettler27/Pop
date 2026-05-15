export class GameError extends Error {
  code: string;

  constructor(message: string, code: string) {
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
  currentState: string;
  expectedState: string;

  constructor(currentState: string, expectedState: string) {
    super(`Invalid game state. Current: ${currentState}, Expected: ${expectedState}`, 'INVALID_GAME_STATE');
    this.name = 'InvalidGameStateError';
    this.currentState = currentState;
    this.expectedState = expectedState;
  }
}
