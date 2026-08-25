import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';

export interface BuzzerQuestionData extends BaseQuestionData {
  title?: string;
  details?: { title?: string };
}

export abstract class BuzzerQuestion extends BaseQuestion {
  title: string | undefined;

  constructor(data: BuzzerQuestionData) {
    super(data);
    this.title = data.title ?? data.details?.title;
  }
}

export interface BuzzerWinner {
  teamId?: string;
  playerId?: string;
  [key: string]: unknown;
}

export interface GameBuzzerQuestionData extends GameQuestionData {
  winner?: BuzzerWinner;
}

export abstract class GameBuzzerQuestion extends GameQuestion {
  winner: BuzzerWinner;

  constructor(data: GameBuzzerQuestionData) {
    super(data);
    this.winner = data.winner ?? {};
    GameBuzzerQuestion.validate(data);
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), winner: this.winner };
  }

  static validate(data: unknown): boolean {
    GameQuestion.validate(data);
    const winner = (data as GameBuzzerQuestionData).winner;
    if (winner !== undefined && typeof winner !== 'object') throw new Error('Winner must be an object');
    return true;
  }

  reset(): void {
    this.winner = {};
  }
}

export interface BuzzerQuestionPlayers {
  buzzed: string[];
  canceled: CanceledPlayer[];
}

export interface CanceledPlayer {
  playerId: string;
  timestamp: unknown;
  clueIdx?: number;
}
