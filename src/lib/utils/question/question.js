import { getRandomElement } from "../arrays";

export const DEFAULT_THINKING_TIME_SECONDS = {
    'progressive_clues': 10,
    'blindtest': 10,
    'emoji': 10,
    'image': 10,
    'quote': 10,
    'mcq': 20,
    'matching': 20,
    'odd_one_out': 15,
    'finale': 20,
    'enum': 60
}


export const ANSWER_TEXT = {
    'en': "Answer",
    'fr-FR': "Réponse"
}

export const CORRECT_ANSWER_TEXT_EN = [
    "Totally, tubular dude!",
    "For sure, like totally!",
    "Absolutely, positively!",
    "You betcha!",
    "Without a doubt, no ifs, ands, or buts!",
    "Affirmative, captain!",
    "Indeed, without question!",
    "Absolutely, without a shadow of a doubt!",
    "Yup, yup, and yup!",
    "Definitely, without a shred of uncertainty!"
];

export const CORRECT_ANSWER_TEXT_FR = [
    "Absolument!",
    "Oui!",
    "Tout à fait!",
    "Exactement!",
    "Bien sûr!",
    "Sans aucun doute!",
    "Évidemment!",
    "C'est ça!",
];

export const CORRECT_ANSWER_TEXT = {
    'en': "Yes!",
    'fr-FR': "Absolument!"
}

export const INCORRECT_ANSWER_TEXT = {
    'en': "No!",
    'fr-FR': "Non!"
}