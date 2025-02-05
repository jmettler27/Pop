export const ROUND_HEADER_TEXT = {
    'en': "Round",
    'fr-FR': "Manche"
}

export const GAME_ROUND_TITLE_MAX_LENGTH = 50

export const GAME_ROUND_DEFAULT_REWARDS = [3, 2, 1]

export const GAME_ROUND_DEFAULT_REWARDS_PER_QUESTION = 1

export const GAME_ROUND_MIN_NUM_QUESTIONS = 5
export const GAME_ROUND_MAX_NUM_QUESTIONS = 100


/* Round types */
import { QUESTION_TYPE_TO_EMOJI, QUESTION_TYPES, QuestionTypeIcon } from './question_types'

export const ROUND_TYPES = [...QUESTION_TYPES, 'mixed']

export const ROUND_TYPE_TO_EMOJI = {
    'mixed': '🔄',
    'special': '🏆',
    ...QUESTION_TYPE_TO_EMOJI
}

export const ROUND_TYPE_TO_TITLE = {
    'en': {
        'mixed': "Mixed",
        'special': "Special Round",
        'progressive_clues': "Progressive Clues",
        'image': "Images",
        'emoji': "Emojis",
        'blindtest': "Blindtests",
        'quote': "Quotes",
        'label': "Labels",
        'enum': "Enumerations",
        'odd_one_out': "Odd One Out",
        'matching': "Matchings",
        'reordering': "Reorderings",
        'mcq': "MCQs",
        'nagui': "Nagui",
        'basic': "Questions"
    },
    'fr-FR': {
        'mixed': "Mixte",
        'special': "Manche spéciale",
        'progressive_clues': "Devinettes",
        'image': "Images",
        'emoji': "Emojis",
        'blindtest': "Blindtests",
        'quote': "Répliques",
        'label': "Étiquettes",
        'enum': "Énumérations",
        'odd_one_out': "Coups par coups",
        'matching': "Matchings",
        'reordering': "Ordonnancements",
        'mcq': "QCMs",
        'nagui': "Nagui",
        'basic': "Questions"
    }
}


export const sortAscendingRoundScores = (roundType) => {
    switch (roundType) {
        case 'odd_one_out':
        case 'matching':
        case 'reordering':
            return true;
        default:
            return false;
    }
}

import { DEFAULT_LOCALE } from '@/lib/utils/locales';

export function roundTypeToTitle(roundType, lang = DEFAULT_LOCALE) {
    return ROUND_TYPE_TO_TITLE[lang][roundType]
}

export function roundTypeToEmoji(roundType) {
    return ROUND_TYPE_TO_EMOJI[roundType]
}

import { prependWithEmojiAndSpace } from '@/lib/utils/emojis';
export function prependRoundTypeWithEmoji(roundType, lang = DEFAULT_LOCALE) {
    const emoji = roundTypeToEmoji(roundType)
    const title = roundTypeToTitle(roundType, lang)
    return prependWithEmojiAndSpace(emoji, title)
}


import RepeatIcon from '@mui/icons-material/Repeat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

export function RoundTypeIcon({ roundType, fontSize = 'small' }) {
    switch (roundType) {
        case 'mixed':
            return <RepeatIcon sx={{ fontSize }} />
        case 'special':
            return <EmojiEventsIcon sx={{ fontSize }} />
        default:
            return <QuestionTypeIcon questionType={roundType} fontSize={fontSize} />
    }
}


/* Validation */
import * as Yup from 'yup'
export const roundTypeSchema = () => Yup.string()
    .oneOf(ROUND_TYPES, "Invalid type.")
    .required("Required.")
