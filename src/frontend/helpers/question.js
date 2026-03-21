import { DEFAULT_LOCALE } from '@/frontend/helpers/locales';

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
