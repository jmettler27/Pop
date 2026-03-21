import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export const QuestionType = {
  PROGRESSIVE_CLUES: 'progressive_clues',
  IMAGE: 'image',
  EMOJI: 'emoji',
  BLINDTEST: 'blindtest',
  QUOTE: 'quote',
  LABELLING: 'labelling',
  ENUMERATION: 'enumeration',
  ODD_ONE_OUT: 'odd_one_out',
  MATCHING: 'matching',
  REORDERING: 'reordering',
  MCQ: 'mcq',
  NAGUI: 'nagui',
  BASIC: 'basic',
};

// Helper functions to validate types
export function isValidQuestionType(type) {
  return Object.values(QuestionType).includes(type);
}

export const QuestionTypeToEmoji = {
  [QuestionType.PROGRESSIVE_CLUES]: '💡',
  [QuestionType.IMAGE]: '🖼️',
  [QuestionType.EMOJI]: '😃',
  [QuestionType.BLINDTEST]: '🎧',
  [QuestionType.QUOTE]: '💬',
  [QuestionType.LABELLING]: '🏷️',
  [QuestionType.ENUMERATION]: '🗣️',
  [QuestionType.ODD_ONE_OUT]: '🕵️',
  [QuestionType.MATCHING]: '💖',
  [QuestionType.REORDERING]: '🔀',
  [QuestionType.MCQ]: '💲',
  [QuestionType.NAGUI]: '🐴',
  [QuestionType.BASIC]: '❓',
};

export const QuestionTypeToTitle = {
  en: {
    [QuestionType.PROGRESSIVE_CLUES]: 'Progressive Clues',
    [QuestionType.IMAGE]: 'Image',
    [QuestionType.EMOJI]: 'Emoji',
    [QuestionType.BLINDTEST]: 'Blindtest',
    [QuestionType.QUOTE]: 'Quote',
    [QuestionType.LABELLING]: 'Labelling',
    [QuestionType.ENUMERATION]: 'Enumeration',
    [QuestionType.ODD_ONE_OUT]: 'Odd One Out',
    [QuestionType.MATCHING]: 'Matching',
    [QuestionType.REORDERING]: 'Reordering',
    [QuestionType.MCQ]: 'MCQ',
    [QuestionType.NAGUI]: 'Nagui',
    [QuestionType.BASIC]: 'Question',
  },
  fr: {
    [QuestionType.PROGRESSIVE_CLUES]: 'Devinette',
    [QuestionType.IMAGE]: 'Image',
    [QuestionType.EMOJI]: 'Emoji',
    [QuestionType.BLINDTEST]: 'Blindtest',
    [QuestionType.QUOTE]: 'Réplique',
    [QuestionType.LABELLING]: 'Étiquettes',
    [QuestionType.ENUMERATION]: 'Énumération',
    [QuestionType.ODD_ONE_OUT]: 'Intrus',
    [QuestionType.MATCHING]: 'Matching',
    [QuestionType.REORDERING]: 'Rangement',
    [QuestionType.MCQ]: 'QCM',
    [QuestionType.NAGUI]: 'Nagui',
    [QuestionType.BASIC]: 'Question',
  },
};

export function questionTypeToEmoji(type) {
  return QuestionTypeToEmoji[type];
}

// Helper functions to get localized titles
export function questionTypeToTitle(type, locale = DEFAULT_LOCALE) {
  return QuestionTypeToTitle[locale]?.[type] || type;
}

export function prependQuestionTypeWithEmoji(type, locale = DEFAULT_LOCALE) {
  const emoji = questionTypeToEmoji(type);
  const title = questionTypeToTitle(type, locale);
  return prependWithEmojiAndSpace(emoji, title);
}

export const QuestionTypeToDescription = {
  en: {
    [QuestionType.PROGRESSIVE_CLUES]: "What's hidden behind these clues?",
    [QuestionType.IMAGE]: "What's hidden behind the image?",
    [QuestionType.EMOJI]: "What's hidden behind the emojis?",
    [QuestionType.BLINDTEST]: "What's hidden behind this song or sound?",
    [QuestionType.QUOTE]: 'Fill the information about this quote.',
    [QuestionType.LABELLING]: 'Label the elements in this image.',
    [QuestionType.ENUMERATION]: 'List as many elements as you can.',
    [QuestionType.ODD_ONE_OUT]: 'Select only the correct proposals.',
    [QuestionType.MATCHING]: 'Match the elements together.',
    [QuestionType.REORDERING]: 'Reorder the elements correctly.',
    [QuestionType.MCQ]: 'One question, multiple choices. Which one is correct?',
    [QuestionType.NAGUI]: 'Hide, square or duo?',
    [QuestionType.BASIC]: 'One question, one answer. Simple as that.',
  },
  fr: {
    [QuestionType.PROGRESSIVE_CLUES]: "Qu'est-ce qui se cache derrière ces indices ?",
    [QuestionType.IMAGE]: "Qu'est-ce qui se cache derrière cette image ?",
    [QuestionType.EMOJI]: "Qu'est-ce qui se cache derrière ces emojis ?",
    [QuestionType.BLINDTEST]: "Qu'est-ce qui se cache derrière cet audio ?",
    [QuestionType.QUOTE]: 'Complétez les informations sur cette réplique.',
    [QuestionType.LABELLING]: 'Décrivez les éléments de cette image.',
    [QuestionType.ENUMERATION]: "Listez autant d'éléments que vous pouvez.",
    [QuestionType.ODD_ONE_OUT]: "Quel est l'intrus ?",
    [QuestionType.MATCHING]: 'Liez correctement les éléments ensemble.',
    [QuestionType.REORDERING]: 'Réorganisez les éléments dans le bon ordre.',
    [QuestionType.MCQ]: 'Une question, plusieurs choix. Lequel est le bon ?',
    [QuestionType.NAGUI]: 'Cache, carré ou duo ?',
    [QuestionType.BASIC]: 'Une question, une réponse. Tout simplement.',
  },
};

export function questionTypeToDescription(type, locale = DEFAULT_LOCALE) {
  return QuestionTypeToDescription[locale]?.[type] || type;
}
