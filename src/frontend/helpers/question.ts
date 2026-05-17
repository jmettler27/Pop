import { DEFAULT_LOCALE, type Locale } from '@/frontend/helpers/locales';

type QuestionElement = 'source' | 'author' | 'answer' | 'topic' | 'title' | 'createdAt' | 'createdBy' | 'note';
type EmojiElement = QuestionElement | 'description';

export const QUESTION_ELEMENT_TO_TITLE: Record<string, Record<string, string>> = {
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

export const QUESTION_ELEMENT_TO_EMOJI: Partial<Record<EmojiElement, string>> = {
  source: '📜',
  author: '🧑',
  description: '📝',
  note: '⚠️',
};

export function questionElementToTitle(element: string, lang: string = DEFAULT_LOCALE): string | undefined {
  return QUESTION_ELEMENT_TO_TITLE[lang]?.[element];
}

export function questionElementToEmoji(element: EmojiElement): string | undefined {
  return QUESTION_ELEMENT_TO_EMOJI[element];
}

export function prependQuestionElementWithEmoji(element: QuestionElement, lang: Locale = DEFAULT_LOCALE): string {
  const emoji = questionElementToEmoji(element) ?? '';
  const title = questionElementToTitle(element, lang) ?? '';
  return `${emoji} ${title}`;
}
