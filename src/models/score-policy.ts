import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export const ScorePolicyType = {
  RANKING: 'ranking',
  COMPLETION_RATE: 'completion_rate',
} as const;

export type ScorePolicyType = (typeof ScorePolicyType)[keyof typeof ScorePolicyType];

export function isValidScorePolicyType(type: ScorePolicyType): type is ScorePolicyType {
  return (Object.values(ScorePolicyType) as ScorePolicyType[]).includes(type);
}

export const ScorePolicyTypeToEmoji: Record<ScorePolicyType, string> = {
  [ScorePolicyType.RANKING]: '🏆',
  [ScorePolicyType.COMPLETION_RATE]: '💯',
};

export const ScorePolicyTypeToTitle: Record<Locale, Record<ScorePolicyType, string>> = {
  en: {
    [ScorePolicyType.RANKING]: 'Ranking in round',
    [ScorePolicyType.COMPLETION_RATE]: 'Completion rate of round',
  },
  fr: {
    [ScorePolicyType.RANKING]: 'Classement dans la manche',
    [ScorePolicyType.COMPLETION_RATE]: 'Taux de complétion de la manche',
  },
};

export function scorePolicyTypeToEmoji(type: ScorePolicyType): string {
  return ScorePolicyTypeToEmoji[type];
}

export function scorePolicyTypeToTitle(type: ScorePolicyType, locale: Locale = DEFAULT_LOCALE): string {
  return ScorePolicyTypeToTitle[locale]?.[type] || type;
}

export function prependScorePolicyTypeWithEmoji(type: ScorePolicyType, locale: Locale = DEFAULT_LOCALE): string {
  const emoji = scorePolicyTypeToEmoji(type);
  const title = scorePolicyTypeToTitle(type, locale);
  return prependWithEmojiAndSpace(emoji, title);
}

export const ROUND_SCORE_POLICY_TYPES = ScorePolicyType;

export function isValidRoundScorePolicy(roundScorePolicy: ScorePolicyType): roundScorePolicy is ScorePolicyType {
  return isValidScorePolicyType(roundScorePolicy);
}

export abstract class ScorePolicy {
  type: ScorePolicyType;

  constructor(type: ScorePolicyType) {
    this.type = type;
  }
}

export class RankingScorePolicy extends ScorePolicy {
  static REWARDS = [3, 2, 1];

  constructor() {
    super(ScorePolicyType.RANKING);
  }
}

export class CompletionRateScorePolicy extends ScorePolicy {
  constructor() {
    super(ScorePolicyType.COMPLETION_RATE);
  }
}

export function createScorePolicy(type: ScorePolicyType): ScorePolicy | null {
  switch (type) {
    case ScorePolicyType.RANKING:
      return new RankingScorePolicy();
    case ScorePolicyType.COMPLETION_RATE:
      return new CompletionRateScorePolicy();
    default:
      return null;
  }
}
