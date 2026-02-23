import { BaseQuestion, GameQuestion } from '@/backend/models/questions/Question';
import { isArray, range, shuffle } from '@/backend/utils/arrays';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import { getNodeText } from '@/frontend/components/game/middle-pane/question/matching/gridUtils';

/**
 * Matching questions
 */
export class MatchingQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;

  static MIN_NUM_COLS = 2;
  static MAX_NUM_COLS = 3;

  static MIN_NUM_ROWS = 5;
  static MAX_NUM_ROWS = 10;

  static ITEM_MAX_LENGTH = 30;

  constructor(data) {
    super(data);
    this.constructor.validate(data);

    this.answer = data.answer || data.details.answer;
    this.note = data.note || data.details.note;
    this.numCols = data.numCols || data.details.numCols;
    this.numRows = data.numRows || data.details.numRows;
    this.title = data.title || data.details.title;
  }

  getQuestionType() {
    return QuestionType.MATCHING;
  }

  toObject() {
    return {
      ...super.toObject(),
      details: {
        answer: this.answer,
        note: this.note,
        numCols: this.numCols,
        numRows: this.numRows,
        title: this.title,
      },
    };
  }

  static validate(data) {
    super.validate(data);

    this.validateAnswer(data);
    this.validateNote(data);
    this.validateNumCols(data);
    this.validateNumRows(data);
    this.validateTitle(data);

    return true;
  }

  static validateAnswer(data) {
    const answer = data.answer || data.details.answer;
    const numRows = data.numRows || data.details.numRows;
    const numCols = data.numCols || data.details.numCols;

    if (!answer) {
      throw new Error('Matching question must have answer');
    }
    if (typeof answer !== 'object') {
      throw new Error('Answer must be an object');
    }

    if (Object.keys(answer).length !== numRows) {
      throw new Error('Answer must have the same number of rows as the number of rows');
    }

    if (answer['0'].length !== numCols) {
      throw new Error('Answer must have the same number of columns as the number of columns');
    }

    for (let i = 0; i < numRows; i++) {
      const row = answer[i.toString()];
      if (!isArray(row)) {
        throw new Error('Answer must be an array of arrays');
      }
      for (let j = 0; j < numCols; j++) {
        const item = row[j];
        if (typeof item !== 'string') {
          throw new Error('Answer must be an array of strings');
        }
        if (item.length > this.constructor.ITEM_MAX_LENGTH) {
          throw new Error(`Answer must be at most ${this.constructor.ITEM_MAX_LENGTH} characters`);
        }
      }
    }

    return true;
  }

  static validateNote(data) {
    const note = data.note || data.details.note;
    if (note) {
      if (typeof note !== 'string') {
        throw new Error('Note must be a string');
      }
      if (note.length > this.constructor.NOTE_MAX_LENGTH) {
        throw new Error(`Note must be at most ${this.constructor.NOTE_MAX_LENGTH} characters`);
      }
    }

    return true;
  }

  static validateNumCols(data) {
    const numCols = data.numCols || data.details.numCols;
    if (!numCols) {
      throw new Error('Number of columns must be a number');
    }

    if (typeof numCols !== 'number') {
      throw new Error('Number of columns must be a number');
    }

    if (numCols < this.constructor.MIN_NUM_COLS) {
      throw new Error(`Number of columns must be at least ${this.constructor.MIN_NUM_COLS}`);
    }

    if (numCols > this.constructor.MAX_NUM_COLS) {
      throw new Error(`Number of columns must be at most ${this.constructor.MAX_NUM_COLS}`);
    }

    return true;
  }

  static validateNumRows(data) {
    const numRows = data.numRows || data.details.numRows;
    if (!numRows) {
      throw new Error('Number of rows must be a number');
    }

    if (typeof numRows !== 'number') {
      throw new Error('Number of rows must be a number');
    }

    if (numRows < this.constructor.MIN_NUM_ROWS) {
      throw new Error(`Number of rows must be at least ${this.constructor.MIN_NUM_ROWS}`);
    }

    if (numRows > this.constructor.MAX_NUM_ROWS) {
      throw new Error(`Number of rows must be at most ${this.constructor.MAX_NUM_ROWS}`);
    }

    return true;
  }

  static validateTitle(data) {
    const title = data.title || data.details.title;
    if (!title) {
      throw new Error('Title must be a string');
    }
    if (typeof title !== 'string') {
      throw new Error('Title must be a string');
    }
    if (title.length > this.constructor.TITLE_MAX_LENGTH) {
      throw new Error(`Title must be at most ${this.constructor.TITLE_MAX_LENGTH} characters`);
    }

    return true;
  }
}

export class GameMatchingQuestion extends GameQuestion {
  static DEFAULT_MISTAKE_PENALTY = 1;
  static MAX_NUM_MISTAKES = 3;

  static THINKING_TIME = 40;

  constructor(data) {
    super(data);

    this.canceled = data.canceled || [];
    this.teamNumMistakes = data.teamNumMistakes || {};
    this.mistakePenalty = data.mistakePenalty || GameMatchingQuestion.DEFAULT_MISTAKE_PENALTY;
    this.maxNumMistakes = data.maxNumMistakes || GameMatchingQuestion.MAX_NUM_MISTAKES;
    this.thinkingTime = data.thinkingTime || GameMatchingQuestion.THINKING_TIME;

    //this.constructor.validate(data);
  }

  toObject() {
    return {
      ...super.toObject(),
      canceled: this.canceled,
      teamNumMistakes: this.teamNumMistakes,
    };
  }

  getQuestionType() {
    return QuestionType.MATCHING;
  }

  static validate(data) {
    super.validate(data);

    this.validateCanceled(data);
    this.validateTeamNumMistakes(data);
    this.validateMistakePenalty(data);
    this.validateMaxNumMistakes(data);
    this.validateThinkingTime(data);

    return true;
  }

  static validateCanceled(data) {
    const canceled = data.canceled;
    if (!canceled) {
      throw new Error('Matching question must have canceled');
    }
    if (!isArray(canceled)) {
      throw new Error('Matching question canceled must be an array');
    }
    return true;
  }

  static validateTeamNumMistakes(data) {
    const teamNumMistakes = data.teamNumMistakes;
    if (teamNumMistakes) {
      if (typeof teamNumMistakes !== 'object') {
        throw new Error('Matching question teamNumMistakes must be an object');
      }
      for (const teamId in teamNumMistakes) {
        if (typeof teamId !== 'string') {
          throw new Error('Matching question teamNumMistakes must be an object of team IDs');
        }
      }
    }
    return true;
  }

  static validateMistakePenalty(data) {
    const mistakePenalty = data.mistakePenalty;
    if (!mistakePenalty) {
      throw new Error('Matching question must have mistakePenalty');
    }
    if (typeof mistakePenalty !== 'number') {
      throw new Error('Matching question mistakePenalty must be a number');
    }
    if (mistakePenalty < 0) {
      throw new Error('Matching question mistakePenalty must be positive');
    }
    return true;
  }

  static validateMaxNumMistakes(data) {
    const maxNumMistakes = data.maxNumMistakes;
    if (!maxNumMistakes) {
      throw new Error('Matching question must have maxNumMistakes');
    }
    if (typeof maxNumMistakes !== 'number') {
      throw new Error('Matching question maxNumMistakes must be a number');
    }
    if (maxNumMistakes < 0) {
      throw new Error('Matching question maxNumMistakes must be positive');
    }
    return true;
  }

  static validateThinkingTime(data) {
    const thinkingTime = data.thinkingTime;
    if (!thinkingTime) {
      throw new Error('Matching question must have thinkingTime');
    }
    if (typeof thinkingTime !== 'number') {
      throw new Error('Matching question thinkingTime must be a number');
    }
    if (thinkingTime < 0) {
      throw new Error('Matching question thinkingTime must be positive');
    }
    return true;
  }

  reset() {
    super.reset();
    this.canceled = [];
    this.teamNumMistakes = {};
  }

  static shuffleMatching(numCols, numRows) {
    const rowIndices = range(numRows); // [0, 1, 2, ..., numRows - 1]
    return new Array(numCols).fill(0).map(() => shuffle(rowIndices));
  }

  static randomMatch(numCols, numRows) {
    return Array.from({ length: numCols }, () => Math.floor(Math.random() * numRows));
  }

  static generateMatch(numRows, numCols, incorrectMatches, correctMatchIndices) {
    // Convert to a Set for efficient lookup
    const incorrectMatchesSet = new Set(incorrectMatches.map((match) => match.join(',')));
    const correctMatchIndicesSet = new Set(correctMatchIndices);

    let newMatch;

    do {
      newMatch = randomMatch(numCols, numRows);
    } while (
      newMatch.some((index) => correctMatchIndicesSet.has(index)) ||
      incorrectMatchesSet.has(newMatch.join(','))
    );

    return newMatch;
  }

  // From a JS array of 3 elements, I want to calculate the largest sub-sequence of same values and return
  //-  the array of indices of those values
  // - The value itself
  // For instance, if the array is [4, 0, 0] the result should be [1, 2] and 4. If the array is [8, 8, 3] the result should be [0, 1] and 8.
  // If the array is [4, 9,4] the result should be [0, 2] and 4
  // If the array is [0, 4, 75] the result should be [] and null
  static findMostFrequentValueAndIndices(arr) {
    const indicesByValue = arr.reduce((acc, value, index) => {
      if (!acc[value]) {
        acc[value] = [];
      }
      acc[value].push(index);
      return acc;
    }, {});

    let mostFrequentValue = null;
    let mostFrequentIndices = [];

    for (const [value, indices] of Object.entries(indicesByValue)) {
      if (indices.length > mostFrequentIndices.length) {
        mostFrequentValue = Number(value);
        mostFrequentIndices = indices;
      }
    }

    if (mostFrequentIndices.length > 1) {
      return [mostFrequentIndices, mostFrequentValue];
    }
    return [[], null];
  }

  static edgesToString(edges, answer) {
    const uniqueStringsSet = new Set();
    edges.forEach((edge) => {
      uniqueStringsSet.add(edge.from);
      uniqueStringsSet.add(edge.to);
    });
    const uniqueEdges = Array.from(uniqueStringsSet);

    const leftToRightPath = uniqueEdges.sort((a, b) => {
      const aCol = parseInt(a.split('_')[1]);
      const bCol = parseInt(b.split('_')[1]);
      return aCol - bCol;
    });

    return leftToRightPath.map((id) => getNodeText(id, answer)).join(' - ');
  }

  static matchingTeamIsCanceled(teamId, teamNumMistakes, maxMistakes) {
    return teamId in teamNumMistakes && teamNumMistakes[teamId] >= maxMistakes;
  }
}
