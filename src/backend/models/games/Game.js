import { GameType, isValidGameType } from '@/backend/models/games/GameType';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { createScorePolicy, isValidScorePolicyType } from '@/backend/models/ScorePolicy';

import { isArray } from '@/backend/utils/arrays';

export default class Game {
  // Validation constants
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

  constructor(data) {
    this.constructor.validate(data);

    this.id = data.id;
    this.title = data.title;
    this.type = data.type;

    this.createdAt = data.createdAt || new Date();
    this.createdBy = data.createdBy;

    this.maxPlayers = data.maxPlayers;

    this.status = data.status || GameStatus.GAME_EDIT;

    this.dateEnd = data.dateEnd;
    this.dateStart = data.dateStart;

    this.currentQuestion = data.currentQuestion;
    this.currentQuestionType = data.currentQuestionType;
  }

  toObject() {
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

  // Validation methods
  static validate(data) {
    if (!data) {
      throw new Error('Game data is required');
    }

    this.validateTitle(data.title);
    this.validateMaxPlayers(data.maxPlayers);
    this.validateGameType(data.type);

    return true;
  }

  static validateTitle(title) {
    if (!title) {
      throw new Error('Title is required');
    }
    if (typeof title !== 'string') {
      throw new Error('Title must be a string');
    }
    if (title.length < this.TITLE_MIN_LENGTH) {
      throw new Error(`Title must be at least ${this.TITLE_MIN_LENGTH} characters long`);
    }
    if (title.length > this.TITLE_MAX_LENGTH) {
      throw new Error(`Title must be at most ${this.TITLE_MAX_LENGTH} characters long`);
    }

    return true;
  }

  static validateMaxPlayers(maxPlayers) {
    if (!maxPlayers) {
      throw new Error('Max num. of players is required');
    }
    if (typeof maxPlayers !== 'number') {
      throw new Error('Max num. of players must be a number');
    }
    if (maxPlayers < this.MIN_NUM_PLAYERS) {
      throw new Error(`Max num. of players must be at least ${this.MIN_NUM_PLAYERS}`);
    }
    if (maxPlayers > this.MAX_NUM_PLAYERS) {
      throw new Error(`Max num. of players must be at most ${this.MAX_NUM_PLAYERS}`);
    }

    return true;
  }

  static validateGameType(type) {
    if (!type) {
      throw new Error('Game type is required');
    }
    if (typeof type !== 'string') {
      throw new Error('Game type must be a string');
    }
    if (!isValidGameType(type)) {
      throw new Error('Invalid game type');
    }

    return true;
  }

  // Game state
  isFinished() {
    return this.status === GameStatus.GAME_END;
  }
}

export class GameRounds extends Game {
  static MIN_NUM_ROUNDS = 1;
  static MAX_NUM_ROUNDS = 10;

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.rounds = data.rounds || [];
    this.roundScorePolicy = data.roundScorePolicy;
    this.currentRound = data.currentRound;
  }

  toObject() {
    return {
      ...super.toObject(),
      rounds: this.rounds,
      roundScorePolicy: this.roundScorePolicy,
      currentRound: this.currentRound,
    };
  }

  // Validation methods
  static validate(data) {
    super.validate(data);

    //this.validateRounds(data.rounds);
    //this.validateRoundScorePolicy(data.roundScorePolicy);

    return true;
  }

  static validateRounds(rounds) {
    if (!rounds) {
      throw new Error('Rounds are required');
    }
    if (!isArray(rounds)) {
      throw new Error('Rounds must be an array');
    }
    if (rounds.length < this.MIN_NUM_ROUNDS) {
      throw new Error(`Game must have at least ${this.MIN_NUM_ROUNDS} round`);
    }
    if (rounds.length > this.MAX_NUM_ROUNDS) {
      throw new Error(`Game must have at most ${this.MAX_NUM_ROUNDS} rounds`);
    }

    return true;
  }

  static validateRoundScorePolicy(roundScorePolicy) {
    if (!roundScorePolicy) {
      throw new Error('Round score policy is required');
    }
    if (!isValidRoundScorePolicy(roundScorePolicy)) {
      throw new Error('Invalid round score policy');
    }

    return true;
  }

  getCurrentRound() {
    return this.currentRound;
  }
}

export class GameRandom extends Game {
  static MIN_NUM_QUESTIONS = 5;
  static MAX_NUM_QUESTIONS = 100;

  constructor(data) {
    super(data);

    this.constructor.validate(data);

    this.questions = data.questions || [];
  }

  toObject() {
    return {
      ...super.toObject(),
      questions: this.questions,
    };
  }

  static validate(data) {
    super.validate(data);

    this.validateQuestions(data.questions);

    return true;
  }

  static validateQuestions(questions) {
    if (!questions) {
      throw new Error('Questions are required');
    }
    if (!isArray(questions)) {
      throw new Error('Questions must be an array');
    }
    if (questions.length < this.MIN_NUM_QUESTIONS) {
      throw new Error(`Game must have at least ${this.MIN_NUM_QUESTIONS} question`);
    }
    if (questions.length > this.MAX_NUM_QUESTIONS) {
      throw new Error(`Game must have at most ${this.MAX_NUM_QUESTIONS} questions`);
    }

    return true;
  }
}
