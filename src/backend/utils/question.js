import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export const ANSWER_TEXT = {
  en: 'Answer',
  fr: 'Réponse',
};

export const CORRECT_ANSWER_TEXT1 = {
  en: [
    'Totally, tubular dude!',
    'For sure, like totally!',
    'Absolutely, positively!',
    'You betcha!',
    'Without a doubt, no ifs, ands, or buts!',
    'Affirmative, captain!',
    'Indeed, without question!',
    'Absolutely, without a shadow of a doubt!',
    'Yup, yup, and yup!',
    'Definitely, without a shred of uncertainty!',
  ],
  fr: [
    'Absolument!',
    'Oui!',
    'Tout à fait!',
    'Exactement!',
    'Bien sûr!',
    'Sans aucun doute!',
    'Évidemment!',
    "C'est ça!",
  ],
};

export const CORRECT_ANSWER_TEXT = {
  en: 'Yes!',
  fr: 'Absolument!',
};

export const INCORRECT_ANSWER_TEXT = {
  en: 'No!',
  fr: 'Non!',
};

export const QUESTION_ELEMENT_TO_TITLE = {
  en: {
    source: 'Source',
    author: 'Author',
    answer: 'Answer',
    topic: 'Topic',
    title: 'Title',
    createdAt: 'Created at',
    createdBy: 'Created by',
    note: 'Note',
  },
  fr: {
    source: 'Source',
    author: 'Auteur',
    answer: 'Réponse',
    topic: 'Sujet',
    title: 'Titre',
    createdAt: 'Créé le',
    createdBy: 'Créé par',
    note: 'Note',
  },
};

export const QUESTION_ELEMENT_TO_EMOJI = {
  source: '📜',
  author: '🧑',
  description: '📝',
  note: '⚠️',
};

export function questionElementToTitle(element, lang = DEFAULT_LOCALE) {
  return QUESTION_ELEMENT_TO_TITLE[lang][element];
}

export function questionElementToEmoji(element) {
  return QUESTION_ELEMENT_TO_EMOJI[element];
}

export function prependQuestionElementWithEmoji(element, lang = DEFAULT_LOCALE) {
  return questionElementToEmoji(element) + ' ' + questionElementToTitle(element, lang);
}
