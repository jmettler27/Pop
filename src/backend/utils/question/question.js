import { QuestionType } from '@/backend/models/questions/QuestionType';
import { GameProgressiveCluesQuestion } from '@/backend/models/questions/ProgressiveClues';
import { GameBlindtestQuestion } from '@/backend/models/questions/Blindtest';
import { GameEmojiQuestion } from '@/backend/models/questions/Emoji';
import { GameImageQuestion } from '@/backend/models/questions/Image';
import { GameQuoteQuestion } from '@/backend/models/questions/Quote';
import { GameLabellingQuestion } from '@/backend/models/questions/Labelling';
import { GameMCQQuestion } from '@/backend/models/questions/MCQ';
import { GameNaguiQuestion } from '@/backend/models/questions/Nagui';
import { GameMatchingQuestion } from '@/backend/models/questions/Matching';
import { GameReorderingQuestion } from '@/backend/models/questions/Reordering';
import { GameOddOneOutQuestion } from '@/backend/models/questions/OddOneOut';
import { GameEnumerationQuestion } from '@/backend/models/questions/Enumeration';
import { GameBasicQuestion } from '@/backend/models/questions/Basic';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

export const DEFAULT_THINKING_TIME_SECONDS = {
  [QuestionType.PROGRESSIVE_CLUES]: GameProgressiveCluesQuestion.THINKING_TIME,
  [QuestionType.BLINDTEST]: GameBlindtestQuestion.THINKING_TIME,
  [QuestionType.EMOJI]: GameEmojiQuestion.THINKING_TIME,
  [QuestionType.IMAGE]: GameImageQuestion.THINKING_TIME,
  [QuestionType.QUOTE]: GameQuoteQuestion.THINKING_TIME,
  [QuestionType.LABELLING]: GameLabellingQuestion.THINKING_TIME,
  [QuestionType.MCQ]: GameMCQQuestion.THINKING_TIME,
  [QuestionType.NAGUI]: GameNaguiQuestion.THINKING_TIME,
  [QuestionType.BASIC]: GameBasicQuestion.THINKING_TIME,
  [QuestionType.MATCHING]: GameMatchingQuestion.THINKING_TIME,
  [QuestionType.ODD_ONE_OUT]: GameOddOneOutQuestion.THINKING_TIME,
  [QuestionType.ENUMERATION]: GameEnumerationQuestion.THINKING_TIME,
  [QuestionType.REORDERING]: GameReorderingQuestion.THINKING_TIME,
  // [QuestionType.SPECIAL]: 20,
};

export const VALIDATE_ANSWER = {
  en: 'Validate',
  fr: 'Valider',
};

export const INVALIDATE_ANSWER = {
  en: 'Invalidate',
  fr: 'Invalider',
};

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
