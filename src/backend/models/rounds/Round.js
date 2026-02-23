import { isValidRoundType } from '@/backend/models/rounds/RoundType';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';

export const RoundStatus = {
  START: 'round_start',
  END: 'round_end',
  QUESTION_ACTIVE: 'question_active',
  QUESTION_END: 'question_end',
};

// Base Round class
export class Round {
  static TITLE_MAX_LENGTH = 50;

  static REWARDS = [3, 2, 1];
  static REWARDS_PER_QUESTION = 1;

  static MIN_NUM_QUESTIONS = 5;
  static MAX_NUM_QUESTIONS = 100;

  constructor(data) {
    if (!data) {
      throw new Error('Round data is required');
    }

    this.id = data.id;

    //this.gameId = data.gameId;
    //if (!this.gameId) {
    //    throw new Error('Game id is required');
    //}

    this.title = data.title;
    // if (!this.title) {
    //   throw new Error('Round title is required');
    // }

    // Handle timestamps in a more abstract way
    this.createdAt = data.createdAt || new Date();
    this.dateStart = data.dateStart || null;
    this.dateEnd = data.dateEnd || null;

    this.order = data.order || null;
    this.questions = data.questions || [];
    this.currentQuestionIdx = data.currentQuestionIdx;

    if (data.scorePolicy === ScorePolicyType.RANKING) {
      this.rewards = data.rewards;
    } else if (data.scorePolicy === ScorePolicyType.COMPLETION_RATE) {
      this.maxPoints = data.maxPoints;
    }
  }

  toObject() {
    const obj = {
      title: this.title,
      createdAt: this.createdAt,
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      order: this.order,
      questions: this.questions,
      currentQuestionIdx: this.currentQuestionIdx,
    };

    if (this.scorePolicy === ScorePolicyType.RANKING) {
      obj.rewards = this.rewards;
    } else if (this.scorePolicy === ScorePolicyType.COMPLETION_RATE) {
      obj.maxPoints = this.maxPoints;
    }

    return obj;
  }

  /**
   * Updates the round ID after Firebase document creation
   * @param {string} id - The new ID from Firebase
   */
  updateId(id) {
    if (!id) {
      throw new Error('Round id is required');
    }
    this.id = id;
  }

  calculateMaxPointsTransaction() {
    throw new Error('calculateMaxPoints not implemented');
  }

  getMaxPoints() {
    return this.maxPoints;
  }

  getQuestionIds() {
    return this.questions;
  }

  getNumQuestions() {
    return this.questions.length;
  }

  static calculateRankDifferences(prevRankings, newRankings) {
    const rankDiff = {};
    for (let i = 0; i < prevRankings.length; i++) {
      for (const teamId of prevRankings[i].teams) {
        const newIndex = newRankings.findIndex((item) => item.teams.includes(teamId));
        const diff = i - newIndex;
        rankDiff[teamId] = diff;
      }
    }
    return rankDiff;
  }

  isLastQuestion() {
    return this.currentQuestionIdx === this.questions.length - 1;
  }
}
