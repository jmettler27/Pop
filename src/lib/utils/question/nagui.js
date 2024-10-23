import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export const NAGUI_OPTIONS = ['hide', 'square', 'duo']

export const NAGUI_OPTION_TO_EMOJI = {
    'hide': "🙈",
    'square': "4️⃣",
    'duo': "2️⃣"
}
export const NAGUI_OPTION_TO_TITLE = {
    'en': {
        'hide': "Cache",
        'square': "Square",
        'duo': "Duo"
    },
    'fr-FR': {
        'hide': "Cache",
        'square': "Carré",
        'duo': "Duo"
    }
}

export const NAGUI_OPTION_TO_SOUND = {
    'hide': 'quest_ce_que_laudace',
    'square': 'cest_carre',
    'duo': 'cest_lheure_du_duo'
}

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Looks4Icon from '@mui/icons-material/Looks4';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
export const NAGUI_OPTION_TO_ICON = {
    'hide': <VisibilityOffIcon />,
    'square': <Looks4Icon />,
    'duo': <LooksTwoIcon />
}

export const NAGUI_DEFAULT_REWARDS = {
    'hide': 5,
    'square': 3,
    'duo': 2
}


export function naguiOptionToTitle(option, lang = DEFAULT_LOCALE) {
    return NAGUI_OPTION_TO_TITLE[lang][option]
}
export function naguiOptionToEmoji(option) {
    return NAGUI_OPTION_TO_EMOJI[option]
}

export function prependNaguiOptionWithEmoji(option, lang = DEFAULT_LOCALE) {
    return naguiOptionToEmoji(option) + " " + naguiOptionToTitle(option, lang)
}


/* NAGUI choices */
export const NAGUI_CHOICES = ["A", "B", "C", "D"]
export const NAGUI_NUMBER_OF_CHOICES = NAGUI_CHOICES.length;

export const NAGUI_CHOICES_EXAMPLE = [
    "101",
    "303",
    "404",
    "506"
]
export const NAGUI_CHOICE_MAX_LENGTH = 100;


/* NAGUI Details */
export const NAGUI_SOURCE_EXAMPLE = {
    'en': "The Matrix",
    'fr-FR': "Matrix"
}
export const NAGUI_SOURCE_MAX_LENGTH = 50;

export const NAGUI_TITLE_EXAMPLE = {
    'en': "What is Neo's room number?",
    'fr-FR': "Quel est le numéro de chambre de Neo ?"
}
export const NAGUI_TITLE_MAX_LENGTH = 125;

export const NAGUI_NOTE_EXAMPLE = ""
export const NAGUI_NOTE_MAX_LENGTH = 500;

export const NAGUI_EXPLANATION_EXAMPLE = {
    'en': "101 is an allusion to Neo's destiny as the One. 101 is also the number usually attributed to a course or manual for beginners in a particular field (in this case it represents the beginning of Neo's path to hacker enlightenment). It can also be seen as an allusion to the Room 101 of George Orwell's novel 'Nineteen Eighty-Four'. It is a torture chamber in the 'Ministry of Love' in which a prisoner is subjected to his or her own worst nightmare, fear or phobia.",
    'fr-FR': "101 est une allusion au destin de Neo en tant que l'Unique. 101 est également le nombre généralement attribué à un cours ou à un manuel destiné aux débutants dans un domaine particulier (dans ce cas, il représente le début du chemin de Neo vers l'illumination du pirate informatique). On peut également y voir une allusion à la salle 101 du roman '1984' de George Orwell. Il s'agit d'une chambre de torture du 'Ministère de l'Amour' dans laquelle un prisonnier est soumis à son pire cauchemar, à sa peur ou à sa phobie,"
}
export const NAGUI_EXPLANATION_MAX_LENGTH = 500;


export const NAGUI_THINKING_TIME = 20;