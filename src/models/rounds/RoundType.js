import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';
import { QuestionType } from '@/models/questions/QuestionType';

export const RoundType = {
  ...QuestionType,
  MIXED: 'mixed',
  SPECIAL: 'special',
};

export function isValidRoundType(type) {
  return Object.values(RoundType).includes(type);
}

export const RoundTypeToEmoji = {
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
  [RoundType.SPECIAL]: '🎉',
};

export const RoundTypeToTitle = {
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
    [RoundType.SPECIAL]: 'Special Round',
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
    [RoundType.SPECIAL]: 'Manche spéciale',
  },
};

export function roundTypeToTitle(type, locale = DEFAULT_LOCALE) {
  return RoundTypeToTitle[locale]?.[type] || type;
}

export function roundTypeToEmoji(roundType) {
  return RoundTypeToEmoji[roundType];
}

export function prependRoundTypeWithEmoji(roundType, lang = DEFAULT_LOCALE) {
  const emoji = roundTypeToEmoji(roundType);
  const title = roundTypeToTitle(roundType, lang);
  return prependWithEmojiAndSpace(emoji, title);
}
