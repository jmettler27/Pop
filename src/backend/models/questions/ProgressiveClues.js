import { BuzzerQuestion, GameBuzzerQuestion } from '@/backend/models/questions/Buzzer';
import { isArray } from '@/backend/utils/arrays';
import { QuestionType } from '@/backend/models/questions/QuestionType';

// Progressive Clues questions
export class ProgressiveCluesQuestion extends BuzzerQuestion {
  static TITLE_MAX_LENGTH = 50;
  static ANSWER_TITLE_MAX_LENGTH = 100;
  static CLUE_MAX_LENGTH = 150;
  static MIN_NUM_CLUES = 2;
  static MAX_NUM_CLUES = 10;

  constructor(data) {
    console.log('data:', data);

    super(data);
    this.constructor.validate(data);

    this.answer = data.answer || data.details.answer;
    this.clues = data.clues || data.details.clues;
    this.title = data.title || data.details.title;
  }

  getQuestionType() {
    return QuestionType.PROGRESSIVE_CLUES;
  }

  toObject() {
    return {
      ...super.toObject(),
      details: {
        answer: this.answer,
        clues: this.clues,
        title: this.title,
      },
    };
  }

  setImage(imageUrl) {
    this.answer.image = imageUrl;
  }

  static validate(data) {
    super.validate(data);

    this.validateTitle(data);
    this.validateAnswer(data);
    this.validateClues(data);

    return true;
  }

  static validateTitle(data) {
    const title = data.title || data.details.title;
    if (!title) {
      throw new Error('Title is required for Progressive Clues question');
    }
    if (typeof title !== 'string') {
      throw new Error('Title must be a string');
    }
    if (title.length > this.constructor.TITLE_MAX_LENGTH) {
      throw new Error(`Title must be at most ${this.constructor.TITLE_MAX_LENGTH} characters`);
    }
  }

  static validateAnswer(data) {
    const answer = data.answer || data.details.answer;
    if (!answer) {
      throw new Error('Answer is required for Progressive Clues question');
    }
    if (typeof answer !== 'object') {
      throw new Error('Answer must be an object');
    }
    if (!answer.title) {
      throw new Error('Answer title is required');
    }
    if (typeof answer.title !== 'string') {
      throw new Error('Answer title must be a string');
    }
    if (answer.title.length > this.constructor.ANSWER_TITLE_MAX_LENGTH) {
      throw new Error(`Answer title must be at most ${this.constructor.ANSWER_TITLE_MAX_LENGTH} characters`);
    }
    if (answer.image && typeof answer.image !== 'string') {
      throw new Error('Answer image must be a string URL');
    }

    return true;
  }

  static validateClues(data) {
    const clues = data.clues || data.details.clues;
    if (!clues || !isArray(clues)) {
      throw new Error('Clues must be an array');
    }
    if (clues.length < this.constructor.MIN_NUM_CLUES) {
      throw new Error(`Must have at least ${this.constructor.MIN_NUM_CLUES} clues`);
    }
    if (clues.length > this.constructor.MAX_NUM_CLUES) {
      throw new Error(`Must have at most ${this.constructor.MAX_NUM_CLUES} clues`);
    }
    clues.forEach((clue, index) => {
      if (typeof clue !== 'string') {
        throw new Error(`Clue at index ${index} must be a string`);
      }
      if (clue.length > this.constructor.CLUE_MAX_LENGTH) {
        throw new Error(`Clue at index ${index} must be at most ${this.constructor.CLUE_MAX_LENGTH} characters`);
      }
      if (!clue.trim()) {
        throw new Error(`Clue at index ${index} cannot be empty`);
      }
    });

    return true;
  }

  getClue(idx) {
    return this.clues[idx];
  }
}

export class GameProgressiveCluesQuestion extends GameBuzzerQuestion {
  static REWARD = 1;
  static MAX_TRIES = 2;
  static THINKING_TIME = 30;
  static DEFAULT_DELAY = 2;

  constructor(data) {
    super(data);

    this.reward = data.reward || GameProgressiveCluesQuestion.REWARD;
    this.maxTries = data.maxTries || GameProgressiveCluesQuestion.MAX_TRIES;
    this.thinkingTime = data.thinkingTime || GameProgressiveCluesQuestion.THINKING_TIME;

    this.currentClueIdx = data.currentClueIdx || -1;
    this.delay = data.delay || GameProgressiveCluesQuestion.DEFAULT_DELAY;

    this.constructor.validate(data);
  }

  toObject() {
    return {
      ...super.toObject(),
      currentClueIdx: this.currentClueIdx,
      thinkingTime: this.thinkingTime,
      reward: this.reward,
      maxTries: this.maxTries,
      delay: this.delay,
    };
  }

  getQuestionType() {
    return QuestionType.PROGRESSIVE_CLUES;
  }

  static validate(data) {
    super.validate(data);

    this.validateCurrentClueIdx(data);
    this.validateThinkingTime(data);
    this.validateReward(data);
    this.validateMaxTries(data);
    this.validateDelay(data);

    return true;
  }

  static validateCurrentClueIdx(data) {
    if (data.currentClueIdx) {
      if (typeof data.currentClueIdx !== 'number') {
        throw new Error('Current clue index must be a number');
      }
      if (this.currentClueIdx < -1 || this.currentClueIdx >= ProgressiveCluesQuestion.MAX_NUM_CLUES) {
        throw new Error(`Current clue index must be between -1 and ${ProgressiveCluesQuestion.MAX_NUM_CLUES - 1}`);
      }
    }
    return true;
  }

  static validateThinkingTime(data) {
    if (data.thinkingTime) {
      if (typeof data.thinkingTime !== 'number') {
        throw new Error('Thinking time must be a number');
      }
      if (data.thinkingTime < 0) {
        throw new Error('Thinking time must be positive');
      }
    }
    return true;
  }

  static validateReward(data) {
    if (data.reward) {
      if (typeof data.reward !== 'number') {
        throw new Error('Reward must be a number');
      }
    }
    return true;
  }

  static validateMaxTries(data) {
    if (data.maxTries) {
      if (typeof data.maxTries !== 'number') {
        throw new Error('Max tries must be a number');
      }
      if (data.maxTries < 0) {
        throw new Error('Max tries must be positive');
      }
    }
    return true;
  }

  static validateDelay(data) {
    if (data.delay) {
      if (typeof data.delay !== 'number') {
        throw new Error('Delay must be a number');
      }
      if (data.delay < 0) {
        throw new Error('Delay must be positive');
      }
    }
    return true;
  }

  getCurrentClueIdx() {
    return this.currentClueIdx;
  }

  incrementClueIdx() {
    this.currentClueIdx++;
  }

  reset() {
    super.reset();
    this.currentClueIdx = -1;
    this.winner = {};
  }
}
