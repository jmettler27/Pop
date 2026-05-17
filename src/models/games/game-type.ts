import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';
import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export const GameType = {
  RANDOM: 'random',
  ROUNDS: 'rounds',
} as const;

export type GameType = (typeof GameType)[keyof typeof GameType];

export function isValidGameType(type: GameType): type is GameType {
  return (Object.values(GameType) as GameType[]).includes(type);
}

export const GameTypeToEmoji: Record<GameType, string> = {
  [GameType.RANDOM]: '🎲',
  [GameType.ROUNDS]: '🔄',
};

export const GameTypeToTitle: Record<Locale, Record<GameType, string>> = {
  en: {
    [GameType.RANDOM]: 'Random',
    [GameType.ROUNDS]: 'Rounds',
  },
  fr: {
    [GameType.RANDOM]: 'Aléatoire',
    [GameType.ROUNDS]: 'Manches',
  },
};

export function gameTypeToEmoji(type: GameType): string {
  return GameTypeToEmoji[type];
}

export function gameTypeToTitle(type: GameType, locale: Locale = DEFAULT_LOCALE): string {
  return GameTypeToTitle[locale][type] || GameTypeToTitle[DEFAULT_LOCALE][type];
}

export function prependGameTypeWithEmoji(type: GameType, locale: Locale = DEFAULT_LOCALE): string {
  const emoji = gameTypeToEmoji(type);
  const title = gameTypeToTitle(type, locale);
  return prependWithEmojiAndSpace(emoji, title);
}

export const GameTypeToDescription: Record<Locale, Record<GameType, string>> = {
  en: {
    [GameType.RANDOM]: 'Random game type',
    [GameType.ROUNDS]: 'Rounds game type',
  },
  fr: {
    [GameType.RANDOM]: 'Partie à questions aléatoires',
    [GameType.ROUNDS]: 'Partie à questions par manches',
  },
};
