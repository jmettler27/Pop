/* MCQ Options */
export const MCQ_OPTIONS = ['hide', 'square', 'duo']

export const MCQ_OPTION_TO_EMOJI = {
    'hide': "💲",
    'square': "4️⃣",
    'duo': "2️⃣"
}
export const MCQ_OPTION_TO_TITLE = {
    'en': {
        'hide': "Cash",
        'square': "Square",
        'duo': "Duo"
    },
    'fr-FR': {
        'hide': "Cash",
        'square': "Carré",
        'duo': "Duo"
    }
}

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Looks4Icon from '@mui/icons-material/Looks4';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
export const MCQ_OPTION_TO_ICON = {
    'hide': <AttachMoneyIcon />,
    'square': <Looks4Icon />,
    'duo': <LooksTwoIcon />
}

export const MCQ_DEFAULT_REWARDS = {
    'hide': 5,
    'square': 3,
    'duo': 2
}

export function mcqOptionToTitle(option, lang = 'en') {
    return MCQ_OPTION_TO_TITLE[lang][option]
}
export function mcqOptionToEmoji(option) {
    return MCQ_OPTION_TO_EMOJI[option]
}

export function prependMCQOptionWithEmoji(option, lang = 'en') {
    return mcqOptionToEmoji(option) + " " + mcqOptionToTitle(option, lang)
}


/* MCQ choices */
export const MCQ_CHOICES = ["A", "B", "C", "D"]
export const MCQ_NUMBER_OF_CHOICES = MCQ_CHOICES.length;

export const MCQ_CHOICES_EXAMPLE = [
    "101",
    "303",
    "404",
    "506"
]
export const MCQ_CHOICE_MAX_LENGTH = 100;


/* MCQ Details */
export const MCQ_SOURCE_EXAMPLE = "The Matrix"
export const MCQ_SOURCE_MAX_LENGTH = 50;

export const MCQ_TITLE_EXAMPLE = "What is Neo's room number?"
export const MCQ_TITLE_MAX_LENGTH = 125;

export const MCQ_NOTE_EXAMPLE = ""
export const MCQ_NOTE_MAX_LENGTH = 50;

export const MCQ_EXPLANATION_EXAMPLE = "101 is an allusion to Neo's destiny as the One. 101 is also the number usually attributed to a course or manual for beginners in a particular field (in this case it represents the beginning of Neo's path to hacker enlightenment). It can also be seen as an allusion to the Room 101 of George Orwell's novel 'Nineteen Eighty-Four'. It is a torture chamber in the 'Ministry of Love' in which a prisoner is subjected to his or her own worst nightmare, fear or phobia."
export const MCQ_EXPLANATION_MAX_LENGTH = 500;
