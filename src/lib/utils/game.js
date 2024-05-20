/* Game types */
export const GAME_TYPES = ['random', 'rounds']
export const GAME_DEFAULT_TYPE = 'rounds'
export const GAME_TYPE_TO_TITLE = {
    'en': {
        'random': "Random",
        'rounds': "Rounds"
    },
    'fr-FR': {
        'random': "Aléatoire",
        'rounds': "Manches"
    }
}
export const GAME_TYPE_TO_EMOJI = {
    'random': '🎲',
    'rounds': '🔄'
}
export function gameTypeToTitle(gameType, lang = 'fr-FR') {
    return GAME_TYPE_TO_TITLE[lang][gameType]
}

import { prependWithEmojiAndSpace } from '@/lib/utils/emojis';
export function gameTypeToEmoji(gameType) {
    return GAME_TYPE_TO_EMOJI[gameType]
}

export function prependGameTypeWithEmoji(gameType, lang = 'fr-FR') {
    return prependWithEmojiAndSpace(gameTypeToEmoji(gameType), gameTypeToTitle(gameType, lang))
}

/* Validation */
import * as Yup from 'yup'
export const gameTypeSchema = () => Yup.string()
    .oneOf(GAME_TYPES, "Invalid game type.")
    .required("Required.")


export const GAME_TITLE_EXAMPLE = "My super duper game"
export const GAME_TITLE_MIN_LENGTH = 2
export const GAME_TITLE_MAX_LENGTH = 50

export const GAME_PARTICIPANT_NAME_MIN_LENGTH = 2
export const GAME_PARTICIPANT_NAME_MAX_LENGTH = 20

export const GAME_TEAM_NAME_MIN_LENGTH = 2
export const GAME_TEAM_MAX_NAME_LENGTH = 20

export const GAME_MIN_NUMBER_OF_TEAMS = 2
export const GAME_MAX_NUMBER_OF_TEAMS = 10

export const GAME_MIN_NUMBER_OF_PLAYERS = 2
export const GAME_MAX_NUMBER_OF_PLAYERS = 10

export const GAME_MIN_NUMBER_OF_ROUNDS = 1
export const GAME_MAX_NUMBER_OF_ROUNDS = 10

export const GAME_HEADER_TEXT = {
    'en': "Game",
    'fr-FR': "Partie"
}