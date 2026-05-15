import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';
import { QuestionType } from '@/models/questions/question-type';

export const RoundType = {
  ...QuestionType,
  MIXED: 'mixed',
} as const;

export type RoundType = (typeof RoundType)[keyof typeof RoundType];

export function isValidRoundType(type: RoundType): type is RoundType {
  return (Object.values(RoundType) as RoundType[]).includes(type);
}

export const RoundTypeToEmoji: Record<RoundType, string> = {
  [RoundType.BASIC]: '❓',
  [RoundType.BLINDTEST]: '🎧',
  [RoundType.EMOJI]: '😃',
  [RoundType.ENUMERATION]: '🗣️',
  [RoundType.IMAGE]: '🖼️',
  [RoundType.ESTIMATION]: '📏',
  [RoundType.LABELLING]: '🏷️',
  [RoundType.MATCHING]: '💖',
  [RoundType.MCQ]: '💲',
  [RoundType.NAGUI]: '🐴',
  [RoundType.ODD_ONE_OUT]: '🕵️',
  [RoundType.PROGRESSIVE_CLUES]: '💡',
  [RoundType.QUOTE]: '💬',
  [RoundType.REORDERING]: '🔀',
  [RoundType.MIXED]: '🔀',
};

export const RoundTypeToTitle: Record<Locale, Record<RoundType, string>> = {
  en: {
    [RoundType.BASIC]: 'Basic questions',
    [RoundType.BLINDTEST]: 'Blindtests',
    [RoundType.EMOJI]: 'Emojis',
    [RoundType.ENUMERATION]: 'Enumerations',
    [RoundType.ESTIMATION]: 'Estimations',
    [RoundType.IMAGE]: 'Images',
    [RoundType.LABELLING]: 'Labellings',
    [RoundType.MATCHING]: 'Matchings',
    [RoundType.MCQ]: 'MCQs',
    [RoundType.NAGUI]: 'Nagui',
    [RoundType.ODD_ONE_OUT]: 'Odd One Out',
    [RoundType.PROGRESSIVE_CLUES]: 'Progressive Clues',
    [RoundType.QUOTE]: 'Quotes',
    [RoundType.REORDERING]: 'Reorderings',
    [RoundType.MIXED]: 'Mixed',
  },
  fr: {
    [RoundType.BASIC]: 'Questions basiques',
    [RoundType.BLINDTEST]: 'Blindtests',
    [RoundType.EMOJI]: 'Emojis',
    [RoundType.ENUMERATION]: 'Énumérations',
    [RoundType.ESTIMATION]: 'Estimations',
    [RoundType.IMAGE]: 'Images',
    [RoundType.LABELLING]: 'Étiquettes',
    [RoundType.MATCHING]: 'Matchings',
    [RoundType.MCQ]: 'QCMs',
    [RoundType.NAGUI]: 'Nagui',
    [RoundType.ODD_ONE_OUT]: 'Intrus',
    [RoundType.PROGRESSIVE_CLUES]: 'Devinettes',
    [RoundType.QUOTE]: 'Répliques',
    [RoundType.REORDERING]: 'Rangements',
    [RoundType.MIXED]: 'Mixte',
  },
};

export function roundTypeToTitle(type: RoundType, locale: Locale = DEFAULT_LOCALE): string {
  return RoundTypeToTitle[locale]?.[type] || type;
}

export function roundTypeToEmoji(roundType: RoundType): string {
  return RoundTypeToEmoji[roundType];
}

export function prependRoundTypeWithEmoji(roundType: RoundType, lang: Locale = DEFAULT_LOCALE): string {
  const emoji = roundTypeToEmoji(roundType);
  const title = roundTypeToTitle(roundType, lang);
  return prependWithEmojiAndSpace(emoji, title);
}
