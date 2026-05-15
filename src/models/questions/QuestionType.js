import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export const QuestionType = {
  BASIC: 'basic',
  BLINDTEST: 'blindtest',
  EMOJI: 'emoji',
  ENUMERATION: 'enumeration',
  ESTIMATION: 'estimation',
  IMAGE: 'image',
  LABELLING: 'labelling',
  MATCHING: 'matching',
  MCQ: 'mcq',
  NAGUI: 'nagui',
  ODD_ONE_OUT: 'odd_one_out',
  PROGRESSIVE_CLUES: 'progressive_clues',
  QUOTE: 'quote',
  REORDERING: 'reordering',
};

// Helper functions to validate types
export function isValidQuestionType(type) {
  return Object.values(QuestionType).includes(type);
}

export const QuestionTypeToEmoji = {
  [QuestionType.BASIC]: '❓',
  [QuestionType.BLINDTEST]: '🎧',
  [QuestionType.EMOJI]: '😃',
  [QuestionType.ENUMERATION]: '🗣️',
  [QuestionType.ESTIMATION]: '📏',
  [QuestionType.IMAGE]: '🖼️',
  [QuestionType.LABELLING]: '🏷️',
  [QuestionType.MATCHING]: '💖',
  [QuestionType.MCQ]: '💲',
  [QuestionType.NAGUI]: '🐴',
  [QuestionType.ODD_ONE_OUT]: '🕵️',
  [QuestionType.PROGRESSIVE_CLUES]: '💡',
  [QuestionType.QUOTE]: '💬',
  [QuestionType.REORDERING]: '🔀',
};

export const QuestionTypeToTitle = {
  en: {
    [QuestionType.BASIC]: 'Basic question',
    [QuestionType.BLINDTEST]: 'Blindtest',
    [QuestionType.EMOJI]: 'Emoji',
    [QuestionType.ENUMERATION]: 'Enumeration',
    [QuestionType.ESTIMATION]: 'Estimation',
    [QuestionType.IMAGE]: 'Image',
    [QuestionType.LABELLING]: 'Labelling',
    [QuestionType.MATCHING]: 'Matching',
    [QuestionType.MCQ]: 'MCQ',
    [QuestionType.NAGUI]: 'Nagui',
    [QuestionType.ODD_ONE_OUT]: 'Odd One Out',
    [QuestionType.PROGRESSIVE_CLUES]: 'Progressive Clues',
    [QuestionType.QUOTE]: 'Quote',
    [QuestionType.REORDERING]: 'Reordering',
  },
  fr: {
    [QuestionType.BASIC]: 'Question basique',
    [QuestionType.BLINDTEST]: 'Blindtest',
    [QuestionType.EMOJI]: 'Emoji',
    [QuestionType.ENUMERATION]: 'Énumération',
    [QuestionType.ESTIMATION]: 'Estimation',
    [QuestionType.IMAGE]: 'Image',
    [QuestionType.LABELLING]: 'Étiquettes',
    [QuestionType.MATCHING]: 'Matching',
    [QuestionType.MCQ]: 'QCM',
    [QuestionType.NAGUI]: 'Nagui',
    [QuestionType.ODD_ONE_OUT]: 'Intrus',
    [QuestionType.PROGRESSIVE_CLUES]: 'Devinette',
    [QuestionType.QUOTE]: 'Réplique',
    [QuestionType.REORDERING]: 'Rangement',
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
    [QuestionType.BASIC]: 'One question, one answer. Simple as that.',
    [QuestionType.BLINDTEST]: "What's hidden behind this song or sound?",
    [QuestionType.EMOJI]: "What's hidden behind the emojis?",
    [QuestionType.ENUMERATION]: 'List as many elements as you can.',
    [QuestionType.ESTIMATION]: 'How many ... ? In what year ... ? Estimate the correct value.',
    [QuestionType.IMAGE]: "What's hidden behind the image?",
    [QuestionType.LABELLING]: 'Label the elements in this image.',
    [QuestionType.MATCHING]: 'Match the elements together.',
    [QuestionType.MCQ]: 'One question, multiple choices. Which one is correct?',
    [QuestionType.NAGUI]: 'Hide, square or duo?',
    [QuestionType.ODD_ONE_OUT]: 'Select only the correct proposals.',
    [QuestionType.PROGRESSIVE_CLUES]: "What's hidden behind these clues?",
    [QuestionType.QUOTE]: 'Fill the information about this quote.',
    [QuestionType.REORDERING]: 'Reorder the elements correctly.',
  },
  fr: {
    [QuestionType.BASIC]: 'Une question, une réponse. Tout simplement.',
    [QuestionType.BLINDTEST]: "Qu'est-ce qui se cache derrière cet audio ?",
    [QuestionType.EMOJI]: "Qu'est-ce qui se cache derrière ces emojis ?",
    [QuestionType.ENUMERATION]: "Listez autant d'éléments que vous pouvez.",
    [QuestionType.ESTIMATION]: 'Combien de ... ? En quelle année ... ? Estimez la bonne valeur.',
    [QuestionType.IMAGE]: "Qu'est-ce qui se cache derrière cette image ?",
    [QuestionType.LABELLING]: 'Décrivez les éléments de cette image.',
    [QuestionType.MATCHING]: 'Liez correctement les éléments ensemble.',
    [QuestionType.MCQ]: 'Une question, plusieurs choix. Lequel est le bon ?',
    [QuestionType.NAGUI]: 'Cache, carré ou duo ?',
    [QuestionType.ODD_ONE_OUT]: "Quel est l'intrus ?",
    [QuestionType.PROGRESSIVE_CLUES]: "Qu'est-ce qui se cache derrière ces indices ?",
    [QuestionType.QUOTE]: 'Complétez les informations sur cette réplique.',
    [QuestionType.REORDERING]: 'Remettez les éléments dans le bon ordre.',
  },
};

export function questionTypeToDescription(type, locale = DEFAULT_LOCALE) {
  return QuestionTypeToDescription[locale]?.[type] || type;
}
