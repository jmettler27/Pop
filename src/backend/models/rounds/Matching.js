import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export class MatchingRound extends Round {
  static DEFAULT_MAX_MISTAKES = 3;
  static DEFAULT_MISTAKE_PENALTY = -5;
  static DEFAULT_THINKING_TIME = 60;

  constructor(data) {
    super(data);
    this.type = RoundType.MATCHING;

    this.mistakePenalty = data.mistakePenalty || MatchingRound.DEFAULT_MISTAKE_PENALTY;
    this.maxMistakes = data.maxMistakes || MatchingRound.DEFAULT_MAX_MISTAKES;
    this.thinkingTime = data.thinkingTime || MatchingRound.DEFAULT_THINKING_TIME;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      mistakePenalty: this.mistakePenalty,
      maxMistakes: this.maxMistakes,
      thinkingTime: this.thinkingTime,
    };
  }

  getMistakePenalty() {
    return this.mistakePenalty;
  }

  getMaxMistakes() {
    return this.maxMistakes;
  }
}
