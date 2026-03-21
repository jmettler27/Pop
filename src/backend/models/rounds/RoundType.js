import { QuestionType } from '@/backend/models/questions/QuestionType';
import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';

export const RoundType = {
  ...QuestionType,
  MIXED: 'mixed',
  SPECIAL: 'special',
};

export function isValidRoundType(type) {
  return Object.values(RoundType).includes(type);
}

export const RoundTypeToEmoji = {
  [RoundType.MIXED]: '🔀',
  [RoundType.SPECIAL]: '🎉',
  [RoundType.PROGRESSIVE_CLUES]: '💡',
  [RoundType.IMAGE]: '🖼️',
  [RoundType.EMOJI]: '😃',
  [RoundType.BLINDTEST]: '🎧',
  [RoundType.QUOTE]: '💬',
  [RoundType.LABELLING]: '🏷️',
  [RoundType.ENUMERATION]: '🗣️',
  [RoundType.ODD_ONE_OUT]: '🕵️',
  [RoundType.MATCHING]: '💖',
  [RoundType.REORDERING]: '🔀',
  [RoundType.MCQ]: '💲',
  [RoundType.NAGUI]: '🐴',
  [RoundType.BASIC]: '❓',
};

export const RoundTypeToTitle = {
  en: {
    [RoundType.MIXED]: 'Mixed',
    [RoundType.SPECIAL]: 'Special Round',
    [RoundType.PROGRESSIVE_CLUES]: 'Progressive Clues',
    [RoundType.IMAGE]: 'Images',
    [RoundType.EMOJI]: 'Emojis',
    [RoundType.BLINDTEST]: 'Blindtests',
    [RoundType.QUOTE]: 'Quotes',
    [RoundType.LABELLING]: 'Labellings',
    [RoundType.ENUMERATION]: 'Enumerations',
    [RoundType.ODD_ONE_OUT]: 'Odd One Out',
    [RoundType.MATCHING]: 'Matchings',
    [RoundType.REORDERING]: 'Reorderings',
    [RoundType.MCQ]: 'MCQs',
    [RoundType.NAGUI]: 'Nagui',
    [RoundType.BASIC]: 'Questions',
  },
  fr: {
    [RoundType.MIXED]: 'Mixte',
    [RoundType.SPECIAL]: 'Manche spéciale',
    [RoundType.PROGRESSIVE_CLUES]: 'Devinettes',
    [RoundType.IMAGE]: 'Images',
    [RoundType.EMOJI]: 'Emojis',
    [RoundType.BLINDTEST]: 'Blindtests',
    [RoundType.QUOTE]: 'Répliques',
    [RoundType.LABELLING]: 'Étiquettes',
    [RoundType.ENUMERATION]: 'Énumérations',
    [RoundType.ODD_ONE_OUT]: 'Intrus',
    [RoundType.MATCHING]: 'Matchings',
    [RoundType.REORDERING]: 'Rangements',
    [RoundType.MCQ]: 'QCMs',
    [RoundType.NAGUI]: 'Nagui',
    [RoundType.BASIC]: 'Questions',
  },
};

export function roundTypeToTitle(type, locale = DEFAULT_LOCALE) {
  return RoundTypeToTitle[locale]?.[type] || type;
}

export function roundTypeToEmoji(roundType) {
  return RoundTypeToEmoji[roundType];
}

import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export function prependRoundTypeWithEmoji(roundType, lang = DEFAULT_LOCALE) {
  const emoji = roundTypeToEmoji(roundType);
  const title = roundTypeToTitle(roundType, lang);
  return prependWithEmojiAndSpace(emoji, title);
}
