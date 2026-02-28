import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';

// Buzzer-based questions (progressive_clues, image, blindtest, emoji, basic, quote)
export class BuzzerQuestion extends BaseQuestion {
  constructor(data) {
    super(data);
  }
}

export class GameBuzzerQuestion extends GameQuestion {
  constructor(data) {
    super(data);

    this.winner = data.winner || {};

    this.constructor.validate(data);
  }

  toObject() {
    return {
      ...super.toObject(),
      winner: this.winner,
    };
  }

  static validateWinner(data) {
    const winner = data.winner;
    if (typeof winner !== 'object') {
      throw new Error('Winner must be an object');
    }
    if (winner.teamId) {
      if (typeof winner.teamId !== 'string') {
        throw new Error('Winner teamId must be a string');
      }
    }
    if (winner.playerId) {
      if (typeof winner.playerId !== 'string') {
        throw new Error('Winner playerId must be a string');
      }
    }
  }

  reset() {
    super.reset();
    this.winner = {};
  }
}
