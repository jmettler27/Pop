import { Round } from '@/backend/models/rounds/Round';
import { RoundType } from '@/backend/models/rounds/RoundType';

export const SpecialRoundStatus = {
  HOME: 'special_home',
  THEME_ACTIVE: 'theme_active',
  THEME_END: 'theme_end',
};

// Special round
export class SpecialRound extends Round {
  constructor(data) {
    super(data);
    this.type = RoundType.SPECIAL;
  }

  getMaxPoints() {
    return this.questions.reduce((total, q) => total + q.getMaxPoints(), 0);
  }

  getThinkingTime() {
    return null; // Special rounds may have custom timing rules
  }
}
