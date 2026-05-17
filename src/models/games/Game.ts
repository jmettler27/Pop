import { isArray } from '@/backend/utils/arrays';
import { Locale } from '@/frontend/helpers/locales';
import { GameStatus, type GameStatus as GameStatusType } from '@/models/games/game-status';
import { isValidGameType, type GameType } from '@/models/games/game-type';

import { QuestionType } from '../questions/question-type';
import { ScorePolicy, ScorePolicyType } from '../score-policy';

export interface GameData {
  id?: string;
  title?: string;
  type?: string;
  createdAt?: unknown;
  createdBy?: string;
  maxPlayers?: number;
  status?: string;
  dateEnd?: unknown;
  dateStart?: unknown;
  currentQuestion?: string;
  currentQuestionType?: QuestionType;
  lang?: Locale;
  [key: string]: unknown;
}

export default class Game {
  static TITLE_EXAMPLE = 'My super duper game';
  static TITLE_MIN_LENGTH = 2;
  static TITLE_MAX_LENGTH = 50;
  static PARTICIPANT_NAME_MIN_LENGTH = 2;
  static PARTICIPANT_NAME_MAX_LENGTH = 20;
  static MIN_NUM_TEAMS = 2;
  static MAX_NUM_TEAMS = 10;
  static MIN_NUM_PLAYERS = 2;
  static MAX_NUM_PLAYERS = 10;
  static MIN_PLAYERS = 2;
  static MAX_PLAYERS = 8;

  id: string | undefined;
  title: string | undefined;
  type: GameType;
  createdAt: unknown;
  createdBy: string | undefined;
  maxPlayers: number | undefined;
  status: GameStatusType;
  dateEnd: unknown;
  dateStart: unknown;
  currentQuestion: string | undefined;
  currentQuestionType: QuestionType | undefined;
  lang: Locale | undefined;

  constructor(data: GameData) {
    Game.validate(data);
    this.id = data.id;
    this.title = data.title;
    this.type = data.type as GameType;
    this.createdAt = data.createdAt ?? new Date();
    this.createdBy = data.createdBy;
    this.maxPlayers = data.maxPlayers;
    this.status = (data.status as GameStatusType) ?? GameStatus.GAME_EDIT;
    this.dateEnd = data.dateEnd;
    this.dateStart = data.dateStart;
    this.currentQuestion = data.currentQuestion;
    this.currentQuestionType = data.currentQuestionType;
    this.lang = data.lang;
  }

  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      maxPlayers: this.maxPlayers,
      status: this.status,
      dateEnd: this.dateEnd,
      dateStart: this.dateStart,
      currentQuestion: this.currentQuestion,
      currentQuestionType: this.currentQuestionType,
    };
  }

  static validate(data: unknown): boolean {
    if (!data) throw new Error('Game data is required');
    const d = data as GameData;
    Game.validateTitle(d.title);
    Game.validateMaxPlayers(d.maxPlayers);
    Game.validateGameType(d.type);
    return true;
  }

  static validateTitle(title: unknown): boolean {
    if (!title) throw new Error('Title is required');
    if (typeof title !== 'string') throw new Error('Title must be a string');
    if (title.length < Game.TITLE_MIN_LENGTH)
      throw new Error(`Title must be at least ${Game.TITLE_MIN_LENGTH} characters long`);
    if (title.length > Game.TITLE_MAX_LENGTH)
      throw new Error(`Title must be at most ${Game.TITLE_MAX_LENGTH} characters long`);
    return true;
  }

  static validateMaxPlayers(maxPlayers: unknown): boolean {
    if (!maxPlayers) throw new Error('Max num. of players is required');
    if (typeof maxPlayers !== 'number') throw new Error('Max num. of players must be a number');
    if (maxPlayers < Game.MIN_NUM_PLAYERS)
      throw new Error(`Max num. of players must be at least ${Game.MIN_NUM_PLAYERS}`);
    if (maxPlayers > Game.MAX_NUM_PLAYERS)
      throw new Error(`Max num. of players must be at most ${Game.MAX_NUM_PLAYERS}`);
    return true;
  }

  static validateGameType(type: unknown): boolean {
    if (!type) throw new Error('Game type is required');
    if (typeof type !== 'string') throw new Error('Game type must be a string');
    if (!isValidGameType(type)) throw new Error('Invalid game type');
    return true;
  }

  isFinished(): boolean {
    return this.status === GameStatus.GAME_END;
  }
}

export interface CreateGameRoundsData {
  title: string;
  type: GameType;
  lang: Locale;
  maxPlayers: number;
  roundScorePolicy: ScorePolicyType;
  organizerName: string;
  organizerId: string;
  organizerImage: string;
}

export interface GameRoundsData extends GameData {
  rounds?: string[];
  roundScorePolicy?: ScorePolicyType;
  currentRound?: string;
}

export class GameRounds extends Game {
  static MIN_NUM_ROUNDS = 1;
  static MAX_NUM_ROUNDS = 10;

  rounds: string[];
  roundScorePolicy: ScorePolicyType | undefined;
  currentRound: string | undefined;

  constructor(data: GameRoundsData) {
    super(data);
    this.rounds = data.rounds ?? [];
    this.roundScorePolicy = data.roundScorePolicy;
    this.currentRound = data.currentRound;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      rounds: this.rounds,
      roundScorePolicy: this.roundScorePolicy,
      currentRound: this.currentRound,
    };
  }

  static validate(data: unknown): boolean {
    super.validate(data);
    return true;
  }

  static validateRounds(rounds: unknown): boolean {
    if (!rounds) throw new Error('Rounds are required');
    if (!isArray(rounds)) throw new Error('Rounds must be an array');
    if ((rounds as unknown[]).length < GameRounds.MIN_NUM_ROUNDS)
      throw new Error(`Game must have at least ${GameRounds.MIN_NUM_ROUNDS} round`);
    if ((rounds as unknown[]).length > GameRounds.MAX_NUM_ROUNDS)
      throw new Error(`Game must have at most ${GameRounds.MAX_NUM_ROUNDS} rounds`);
    return true;
  }

  getCurrentRound(): string | undefined {
    return this.currentRound;
  }
}

export interface GameRandomData extends GameData {
  questions?: string[];
}

export class GameRandom extends Game {
  static MIN_NUM_QUESTIONS = 5;
  static MAX_NUM_QUESTIONS = 100;

  questions: string[];

  constructor(data: GameRandomData) {
    super(data);
    this.questions = data.questions ?? [];
  }

  toObject(): Record<string, unknown> {
    return { ...super.toObject(), questions: this.questions };
  }

  static validate(data: unknown): boolean {
    super.validate(data);
    GameRandom.validateQuestions((data as GameRandomData).questions);
    return true;
  }

  static validateQuestions(questions: unknown): boolean {
    if (!questions) throw new Error('Questions are required');
    if (!isArray(questions)) throw new Error('Questions must be an array');
    if ((questions as unknown[]).length < GameRandom.MIN_NUM_QUESTIONS)
      throw new Error(`Game must have at least ${GameRandom.MIN_NUM_QUESTIONS} question`);
    if ((questions as unknown[]).length > GameRandom.MAX_NUM_QUESTIONS)
      throw new Error(`Game must have at most ${GameRandom.MAX_NUM_QUESTIONS} questions`);
    return true;
  }
}
