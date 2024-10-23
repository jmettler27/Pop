export const sortScores = (scores, ascending) =>
    [...new Set(Object.values(scores))].sort((a, b) => ascending ? a - b : b - a);

export const ROUND_SCORE_POLICIES = ['ranking', 'completion_rate']

export const ROUND_SCORE_POLICY_TO_TITLE = {
    'en': {
        'ranking': "Ranking in round",
        'completion_rate': "Completion rate of round"
    },
    'fr-FR': {
        'ranking': "Classement dans la manche",
        'completion_rate': "Taux de complétion de la manche"
    }
}

export const ROUND_SCORE_POLICY_TO_EMOJI = {
    'ranking': "🏆",
    'completion_rate': "💯"
}

import { DEFAULT_LOCALE } from './locales';

export function roundScorePolicyToTitle(policy, locale = DEFAULT_LOCALE) {
    return ROUND_SCORE_POLICY_TO_TITLE[locale][policy]
}

export function roundScorePolicyToEmoji(policy) {
    return ROUND_SCORE_POLICY_TO_EMOJI[policy]
}

import { prependWithEmojiAndSpace } from '@/lib/utils/emojis';
export function prependRoundScorePolicyWithEmoji(policy, lang = DEFAULT_LOCALE) {
    return prependWithEmojiAndSpace(roundScorePolicyToEmoji(policy), roundScorePolicyToTitle(policy, lang))
}


/* Validation */
import * as Yup from 'yup';

export const roundScorePolicySchema = () => Yup.string()
    .oneOf(ROUND_SCORE_POLICIES, "Invalid round score policy.")
    .required("Required.")
