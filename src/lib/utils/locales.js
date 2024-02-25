/* LOCALES */
export const LOCALES = ['en', 'fr-FR']
export const DEFAULT_LOCALE = 'fr-FR'
export const LOCALE_TO_EMOJI = {
    'en': '🇬🇧',
    'fr-FR': '🇫🇷'
}
export const LOCALE_TO_TITLE = {
    'en': "English",
    'fr-FR': "Français (France)"
}

import { prependWithEmojiAndSpace } from '@/lib/utils/emojis'

function localeToTitle(locale) {
    return LOCALE_TO_TITLE[locale]
}
export function localeToEmoji(locale) {
    return LOCALE_TO_EMOJI[locale]
}

export function prependLocaleWithEmoji(locale) {
    return prependWithEmojiAndSpace(localeToEmoji(locale), localeToTitle(locale))
}

/* Validation */
import * as Yup from 'yup';

export const localeSchema = () => Yup.string()
    .oneOf(LOCALES, "Invalid language.")
    .required("Required.")
