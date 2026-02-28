import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export const GameType = {
  RANDOM: 'random',
  ROUNDS: 'rounds',
};

export function isValidGameType(type) {
  return Object.values(GameType).includes(type);
}

export const GameTypeToEmoji = {
  [GameType.RANDOM]: '🎲',
  [GameType.ROUNDS]: '🔄',
};

export const GameTypeToTitle = {
  en: {
    [GameType.RANDOM]: 'Random',
    [GameType.ROUNDS]: 'Rounds',
  },
  fr: {
    [GameType.RANDOM]: 'Aléatoire',
    [GameType.ROUNDS]: 'Manches',
  },
};

export function gameTypeToEmoji(type) {
  return GameTypeToEmoji[type];
}

export function gameTypeToTitle(type, locale = DEFAULT_LOCALE) {
  return GameTypeToTitle[locale][type] || GameTypeToTitle[DEFAULT_LOCALE][type];
}

export function prependGameTypeWithEmoji(type, locale = DEFAULT_LOCALE) {
  const emoji = gameTypeToEmoji(type);
  const title = gameTypeToTitle(type, locale);
  return prependWithEmojiAndSpace(emoji, title);
}

export const GameTypeToDescription = {
  en: {
    [GameType.RANDOM]: 'Random game type',
    [GameType.ROUNDS]: 'Rounds game type',
  },
  fr: {
    [GameType.RANDOM]: 'Partie à questions aléatoires',
    [GameType.ROUNDS]: 'Partie à questions par manches',
  },
};
