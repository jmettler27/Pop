/* LOCALES */
export const LOCALES = ['en', 'fr'];
export const DEFAULT_LOCALE = 'fr';
export const LOCALE_TO_EMOJI = {
  en: '🇬🇧',
  fr: '🇫🇷',
};
export const LOCALE_TO_TITLE = {
  en: 'English',
  fr: 'Français',
};

import { prependWithEmojiAndSpace } from '@/backend/utils/strings';

function localeToTitle(locale) {
  return LOCALE_TO_TITLE[locale];
}
export function localeToEmoji(locale) {
  return LOCALE_TO_EMOJI[locale];
}

export function prependLocaleWithEmoji(locale) {
  return prependWithEmojiAndSpace(localeToEmoji(locale), localeToTitle(locale));
}

/* Validation */
import * as Yup from 'yup';

export const localeSchema = () => Yup.string().oneOf(LOCALES, 'Invalid language.').required('Required.');
