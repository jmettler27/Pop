import * as Yup from 'yup';

import { prependWithEmojiAndSpace } from '@/frontend/helpers/strings';

export type Locale = 'en' | 'fr';

export const LOCALES = ['en', 'fr'] as const satisfies Locale[];
export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALE_TO_EMOJI: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
};
export const LOCALE_TO_TITLE: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

function localeToTitle(locale: Locale): string {
  return LOCALE_TO_TITLE[locale];
}

export function localeToEmoji(locale: Locale): string {
  return LOCALE_TO_EMOJI[locale];
}

export function prependLocaleWithEmoji(locale: Locale): string {
  return prependWithEmojiAndSpace(localeToEmoji(locale), localeToTitle(locale));
}

export const localeSchema = () => Yup.string().oneOf(LOCALES, 'Invalid language.').required('Required.');
