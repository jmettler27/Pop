import { range, shuffle } from '@/backend/utils/arrays';
import { BaseQuestion, GameQuestion, type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';

export interface MatchingQuestionData extends BaseQuestionData {
  answer: MatchingAnswer;
  note?: string;
  numCols?: number;
  numRows?: number;
  title?: string;
  details: { answer?: MatchingAnswer; note?: string; numCols?: number; numRows?: number; title?: string };
}

export class MatchingQuestion extends BaseQuestion {
  static TITLE_MAX_LENGTH = 75;
  static NOTE_MAX_LENGTH = 500;
  static MIN_NUM_COLS = 2;
  static MAX_NUM_COLS = 3;
  static MIN_NUM_ROWS = 5;
  static MAX_NUM_ROWS = 10;
  static ITEM_MAX_LENGTH = 30;

  answer: MatchingAnswer | undefined;
  note: string | undefined;
  numCols: number | undefined;
  numRows: number | undefined;
  title: string | undefined;

  constructor(data: MatchingQuestionData) {
    super(data);
    const d = (data.details ?? {}) as MatchingQuestionData;
    this.answer = data.answer ?? d.answer;
    this.note = data.note ?? d.note;
    this.numCols = data.numCols ?? d.numCols;
    this.numRows = data.numRows ?? d.numRows;
    this.title = data.title ?? d.title;
  }

  getQuestionType(): QuestionType {
    return QuestionType.MATCHING;
  }

  toObject(): Record<string, unknown> {
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

  static validate(data: unknown): boolean {
    return BaseQuestion.validate(data);
  }

  setImage(_imageUrl: string): void {}
  setAudio(_audioUrl: string): void {}
}

export type ColumnIndices = number[]; // Array of row indices, where the index in the array represents the column index

export type Match = string[]; // Array of columns, each column is an array of items (rows)
export type MatchingAnswer = Record<string, Match>; // Array of columns, each column is an array of items (rows)

export interface MatchingEdgeData {
  from: string;
  to: string;
}

export interface CorrectMatch {
  matchIdx: number;
  teamId: string;
  timestamp: unknown;
  userId: string;
}

export interface CorrectMatches {
  correctMatches: CorrectMatch[];
}

export interface IncorrectMatch {
  match: ColumnIndices;
  teamId: string;
  timestamp: unknown;
  userId: string;
}

export interface IncorrectMatches {
  incorrectMatches: IncorrectMatch[];
}

export interface PartiallyCorrectMatch {
  colIndices: number[];
  matchIdx: number;
  teamId: string;
  timestamp: unknown;
  userId: string;
}

export interface PartiallyCorrectMatches {
  partiallyCorrectMatches: PartiallyCorrectMatch[];
}

export interface GameMatchingQuestionData extends GameQuestionData {
  canceled?: string[];
  teamNumMistakes?: Record<string, number>;
  mistakePenalty?: number;
  maxNumMistakes?: number;
  thinkingTime?: number;
}

export class GameMatchingQuestion extends GameQuestion {
  static DEFAULT_MISTAKE_PENALTY = 1;
  static MAX_NUM_MISTAKES = 3;
  static THINKING_TIME = 60;

  canceled: string[];
  teamNumMistakes: Record<string, number>;
  mistakePenalty: number;
  maxNumMistakes: number;
  thinkingTime: number;

  constructor(data: GameMatchingQuestionData) {
    super(data);
    this.canceled = data.canceled ?? [];
    this.teamNumMistakes = data.teamNumMistakes ?? {};
    this.mistakePenalty = data.mistakePenalty ?? GameMatchingQuestion.DEFAULT_MISTAKE_PENALTY;
    this.maxNumMistakes = data.maxNumMistakes ?? GameMatchingQuestion.MAX_NUM_MISTAKES;
    this.thinkingTime = data.thinkingTime ?? GameMatchingQuestion.THINKING_TIME;
  }

  getQuestionType(): QuestionType {
    return QuestionType.MATCHING;
  }

  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      thinkingTime: this.thinkingTime,
      canceled: this.canceled,
      teamNumMistakes: this.teamNumMistakes,
    };
  }

  static validate(data: unknown): boolean {
    return GameQuestion.validate(data);
  }

  reset(): void {
    this.canceled = [];
    this.teamNumMistakes = {};
  }

  static shuffleMatching(numCols: number, numRows: number): ColumnIndices[] {
    const rowIndices = range(numRows);
    return new Array(numCols).fill(0).map(() => shuffle(rowIndices));
  }

  static randomMatch(numCols: number, numRows: number): ColumnIndices {
    return Array.from({ length: numCols }, () => Math.floor(Math.random() * numRows));
  }

  static generateMatch(
    numRows: number,
    numCols: number,
    incorrectMatches: ColumnIndices[],
    correctMatchIndices: ColumnIndices
  ): ColumnIndices {
    // Convert to a Set for efficient lookup
    const incorrectMatchesSet = new Set(incorrectMatches.map((match) => match.join(',')));
    const correctMatchIndicesSet = new Set(correctMatchIndices);

    let newMatch;

    do {
      newMatch = this.randomMatch(numCols, numRows);
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
  static findMostFrequentValueAndIndices(arr: ColumnIndices): [number[], number | null] {
    const indicesByValue = arr.reduce((acc: Record<number, number[]>, value: number, index: number) => {
      if (!acc[value]) {
        acc[value] = [];
      }
      acc[value].push(index);
      return acc;
    }, {});

    let mostFrequentValue: number | null = null;
    let mostFrequentIndices: number[] = [];

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

  static edgesToString(edges: MatchingEdgeData[], answer: MatchingAnswer): string {
    const uniqueStringsSet = new Set<string>();
    edges.forEach((edge) => {
      uniqueStringsSet.add(edge.from);
      uniqueStringsSet.add(edge.to);
    });
    const leftToRightPath = Array.from(uniqueStringsSet).sort((a, b) => {
      const aCol = parseInt(a.split('_')[1]!);
      const bCol = parseInt(b.split('_')[1]!);
      return aCol - bCol;
    });
    const getNodeText = (id: string): string => {
      const [origRow, col] = id.split('_').map(Number);
      return answer[origRow!]?.[col!] ?? '';
    };
    return leftToRightPath.map((id) => getNodeText(id)).join(' - ');
  }

  static matchingTeamIsCanceled(teamId: string, teamNumMistakes: Record<string, number>, maxMistakes: number): boolean {
    return teamId in teamNumMistakes && teamNumMistakes[teamId] >= maxMistakes;
  }
}
