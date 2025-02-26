import { BASIC_QUESTION_THINKING_TIME } from "./basic";
import { BLINDTEST_THINKING_TIME } from "./blindtest";
import { EMOJI_THINKING_TIME } from "./emoji";
import { ENUM_MIN_THINKING_SECONDS } from "./enum";
import { IMAGE_THINKING_TIME } from "./image";
import { LABEL_THINKING_TIME } from "./label";
import { MATCHING_THINKING_TIME } from "./matching";
import { MCQ_THINKING_TIME } from "./mcq";
import { NAGUI_THINKING_TIME } from "./nagui";
import { OOO_THINKING_TIME } from "./odd_one_out";
import { PROGRESSIVE_CLUES_THINKING_TIME } from "./progressive_clues";
import { QUOTE_THINKING_TIME } from "./quote";

export const DEFAULT_THINKING_TIME_SECONDS = {
    'progressive_clues': PROGRESSIVE_CLUES_THINKING_TIME,
    'blindtest': BLINDTEST_THINKING_TIME,
    'emoji': EMOJI_THINKING_TIME,
    'image': IMAGE_THINKING_TIME,
    'quote': QUOTE_THINKING_TIME,
    'label': LABEL_THINKING_TIME,
    'mcq': MCQ_THINKING_TIME,
    'nagui': NAGUI_THINKING_TIME,
    'basic': BASIC_QUESTION_THINKING_TIME,
    'matching': MATCHING_THINKING_TIME,
    'odd_one_out': OOO_THINKING_TIME,
    'special': 20,
    'enum': ENUM_MIN_THINKING_SECONDS
}


export const VALIDATE_ANSWER = {
    'en': "Validate",
    'fr-FR': "Valider"
}

export const INVALIDATE_ANSWER = {
    'en': "Invalidate",
    'fr-FR': "Invalider"
}

export const ANSWER_TEXT = {
    'en': "Answer",
    'fr-FR': "Réponse"
}

export const CORRECT_ANSWER_TEXT1 = {
    'en': [
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
    ],
    'fr-FR': [
        "Absolument!",
        "Oui!",
        "Tout à fait!",
        "Exactement!",
        "Bien sûr!",
        "Sans aucun doute!",
        "Évidemment!",
        "C'est ça!",
    ]
}

export const CORRECT_ANSWER_TEXT = {
    'en': "Yes!",
    'fr-FR': "Absolument!"
}

export const INCORRECT_ANSWER_TEXT = {
    'en': "No!",
    'fr-FR': "Non!"
}

export const QUESTION_ELEMENT_TO_TITLE = {
    'en': {
        'source': "Source",
        'author': "Author",
        'answer': "Answer",
        'topic': "Topic",
        'title': "Title",
        'createdAt': "Created at",
        'createdBy': "Created by",
        'note': "Note",
    },
    'fr-FR': {
        'source': "Source",
        'author': "Auteur",
        'answer': "Réponse",
        'topic': "Sujet",
        'title': "Titre",
        'createdAt': "Créé le",
        'createdBy': "Créé par",
        'note': "Note",
    }
}

export const QUESTION_ELEMENT_TO_EMOJI = {
    'source': "📜",
    'author': "🧑",
    'description': "📝",
    'note': "⚠️",
}

import { DEFAULT_LOCALE } from '@/lib/utils/locales';

export function questionElementToTitle(element, lang = DEFAULT_LOCALE) {
    return QUESTION_ELEMENT_TO_TITLE[lang][element]
}
export function questionElementToEmoji(element) {
    return QUESTION_ELEMENT_TO_EMOJI[element]
}

export function prependQuestionElementWithEmoji(element, lang = DEFAULT_LOCALE) {
    return questionElementToEmoji(element) + " " + questionElementToTitle(element, lang)
}