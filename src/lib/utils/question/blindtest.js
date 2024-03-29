/*  Blindtest  */
export const BLINDTEST_TYPES = ['song', 'sound']

export const BLINDTEST_TYPE_TO_TITLE = {
    'en': {
        'song': 'Song',
        'sound': 'Sound'
    },
    'fr-FR': {
        'song': 'Chanson',
        'sound': 'Son'
    }
}

export const BLINDTEST_TITLE_EXAMPLE = "Film"
export const BLINDTEST_TITLE_MAX_LENGTH = 50

export const BLINDTEST_ANSWER_TITLE_EXAMPLE = "Can You Hear The Music"
export const BLINDTEST_ANSWER_TITLE_MAX_LENGTH = 50

export const BLINDTEST_ANSWER_SOURCE_EXAMPLE = "Oppenheimer"
export const BLINDTEST_ANSWER_SOURCE_MAX_LENGTH = 75

export const BLINDTEST_ANSWER_AUTHOR_EXAMPLE = "Ludwig Göransson"
export const BLINDTEST_ANSWER_AUTHOR_MAX_LENGTH = 50

export const BLINDTEST_DEFAULT_REWARD = 1

/* Validation  */
import * as Yup from 'yup'

export const subtypeSchema = () => Yup.string()
    .oneOf(BLINDTEST_TYPES, "Invalid question subtype.")
    .required("Required.")
