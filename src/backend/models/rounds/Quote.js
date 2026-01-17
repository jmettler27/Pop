import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';
export class QuoteRound extends Round {
  static MAX_TRIES = 2;
  static DEFAULT_INVALIDATE_TEAM = false;
  static DEFAULT_THINKING_TIME = 30;
  static REWARDS_PER_ELEMENT = 1;

  constructor(data) {
    super(data);
    this.type = RoundType.QUOTE;

    this.maxTries = data.maxTries || QuoteRound.MAX_TRIES;
    this.invalidateTeam = data.invalidateTeam || QuoteRound.DEFAULT_INVALIDATE_TEAM;
    this.thinkingTime = data.thinkingTime || QuoteRound.DEFAULT_THINKING_TIME;
    this.rewardsPerElement = data.rewardsPerElement || QuoteRound.REWARDS_PER_ELEMENT;
  }

  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      maxTries: this.maxTries,
      invalidateTeam: this.invalidateTeam,
      thinkingTime: this.thinkingTime,
      rewardsPerElement: this.rewardsPerElement,
    };
  }

  calculateMaxPointsTransaction() {
    // The total number of quote elements to guess in the round
    const totalNumElements = this.questions.reduce((acc, { details: { toGuess, quoteParts } }) => {
      return acc + toGuess.length + (toGuess.includes('quote') ? quoteParts.length - 1 : 0);
    }, 0);
    return totalNumElements * this.rewardsPerElement;
  }
}
