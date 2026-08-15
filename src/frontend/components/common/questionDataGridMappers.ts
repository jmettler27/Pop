import type { IntlShape } from 'react-intl';

import { localeToEmoji, type Locale } from '@/frontend/helpers/locales';
import { timestampToDate1, type FirestoreTimestamp } from '@/frontend/helpers/time';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { BlindtestQuestion } from '@/models/questions/blindtest';
import { QuestionType } from '@/models/questions/question-type';
import type { AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import { QuoteAuthorElement, QuotePartElement, QuoteQuestion, QuoteSourceElement } from '@/models/questions/quote';
import { topicToEmoji, type Topic } from '@/models/topic';
import User from '@/models/users/user';

export const messages = defineMessages('frontend.questions.QuestionDataGrid', {
  id: 'ID',
  title: 'Title',
  source: 'Source',
  topic: 'Topic',
  createdAt: 'Created at',
  createdBy: 'Created by',
  type: 'Type',
  description: 'Description',
  matches: 'Nb. matches',
  enumAnswers: 'Nb. answers',
  enumThinking: 'Thinking time (s)',
  challengeTime: 'Challenge time (s)',
  oddOneOut: 'Odd one out',
  matchingColumns: 'Nb. columns',
  quoteToGuess: 'To guess',
  numLabels: 'Nb. labels',
  choices: 'Nb. choices',
  search: 'Search…',
  rowsPerPage: 'Rows per page',
  pageOf: 'Page {page} of {total}',
});

// A column spec, structurally identical to the old MUI GridColDef shape (field/headerName/width)
// so the 14 per-question-type builders below stay near-identical to their MUI-era form.
export interface ColSpec {
  field: string;
  headerName: string;
  width: number;
}

export type Row = Record<string, unknown>;

// PROGRESSIVE CLUES
const progressiveCluesQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; answer: { title: string }; clues: string[] };
  return {
    title: q.title,
    answer: q.answer.title,
  };
};
const progressiveCluesQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 150 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 250 },
];

// BASIC
const basicQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answer: string; explanation?: string; source?: string; title: string };
  return {
    answer: q.answer,
    source: q.source,
    title: q.title,
  };
};
const basicQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 200 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 250 },
];

// BLINDTEST
const blindtestQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { subtype: string; title: string; answer: { source?: string; author?: string; title: string } };
  return {
    subtype: BlindtestQuestion.typeToEmoji(q.subtype),
    title: q.title,
    answer_source: q.answer.source,
    answer_author: q.answer.author,
    answer_title: q.answer.title,
  };
};
const blindtestQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'subtype', headerName: intl.formatMessage(messages.type), width: 100 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 150 },
  { field: 'answer_source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'answer_author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'answer_title', headerName: intl.formatMessage(messages.title), width: 200 },
];

// EMOJI
const emojiQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; answer: { title: string }; clue: string };
  return {
    title: q.title,
    answer: q.answer.title,
    clue: q.clue,
  };
};
const emojiQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 225 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 225 },
  { field: 'clue', headerName: intl.formatMessage(globalMessages.clue), width: 200 },
];

// ENUMERATION
const enumerationQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as {
    title: string;
    answer: string[];
    maxIsKnown: boolean;
    thinkingTime?: number;
    challengeTime?: number;
  };
  return {
    title: q.title,
    numAnswers: q.maxIsKnown ? q.answer.length : '>= ' + q.answer.length,
    thinkingTime: q.thinkingTime,
    challengeTime: q.challengeTime,
  };
};
const enumerationQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 400 },
  { field: 'numAnswers', headerName: intl.formatMessage(messages.enumAnswers), width: 150 },
  { field: 'thinkingTime', headerName: intl.formatMessage(messages.enumThinking), width: 150 },
  { field: 'challengeTime', headerName: intl.formatMessage(messages.challengeTime), width: 150 },
];

// ESTIMATION
const estimationQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answer: unknown; source?: string; title: string };
  return {
    answer: q.answer,
    source: q.source,
    title: q.title,
  };
};
const estimationQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 200 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 500 },
];

// IMAGE
const imageQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; answer: { description?: string; source: string } };
  return {
    title: q.title,
    description: q.answer.description,
    source: q.answer.source,
  };
};
const imageQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'description', headerName: intl.formatMessage(messages.description), width: 500 },
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 300 },
];

// LABELLING
const labellingQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; labels: string[] };
  return {
    numLabels: q.labels.length,
    title: q.title,
  };
};
const labellingQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'numLabels', headerName: intl.formatMessage(messages.numLabels), width: 150 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
];

// MATCHING
const matchingQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; numCols: number; numRows: number };
  return {
    title: q.title,
    numCols: q.numCols,
    numRows: q.numRows,
  };
};
const matchingQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'numCols', headerName: intl.formatMessage(messages.matchingColumns), width: 150 },
  { field: 'numRows', headerName: intl.formatMessage(messages.matches), width: 150 },
];

// MCQ
const mcqQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as {
    answerIdx: number;
    choices: string[];
    explanation?: string;
    note?: string;
    source?: string;
    title: string;
  };
  return {
    numChoices: q.choices.length,
    answer: q.choices[q.answerIdx],
    source: q.source,
    title: q.title,
  };
};
const mcqQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'numChoices', headerName: intl.formatMessage(messages.choices), width: 150 },
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 300 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 500 },
];

// NAGUI
const naguiQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as {
    answerIdx: number;
    choices: string[];
    explanation?: string;
    source?: string;
    title: string;
  };
  return {
    answer: q.choices[q.answerIdx],
    source: q.source,
    title: q.title,
  };
};
const naguiQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 300 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 500 },
];

// ODD ONE OUT
const oddOneOutQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answerIdx: number; items: Array<{ title: string }>; title: string };
  return {
    title: q.title,
    oddOneOut: q.items[q.answerIdx].title,
  };
};
const oddOneOutQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'oddOneOut', headerName: intl.formatMessage(messages.oddOneOut), width: 250 },
];

// QUOTE
const quoteQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { author?: string; quote: string; source?: string; toGuess: string[] };
  const sortedToGuess = [...q.toGuess].sort((a, b) => {
    return QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(a) - QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(b);
  });
  const quoteElementEmoji: Record<string, string> = {
    [QuoteSourceElement.TYPE]: QuoteSourceElement.TYPE_TO_EMOJI,
    [QuoteAuthorElement.TYPE]: QuoteAuthorElement.TYPE_TO_EMOJI,
    [QuotePartElement.TYPE]: QuotePartElement.TYPE_TO_EMOJI,
  };
  const toGuessWithEmojis = sortedToGuess.map((item) => quoteElementEmoji[item] ?? item).join(', ');

  return {
    author: q.author,
    quote: `"${q.quote}"`,
    source: q.source,
    toGuess: toGuessWithEmojis,
  };
};
const quoteQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'quote', headerName: intl.formatMessage(globalMessages.quote), width: 500 },
  { field: 'toGuess', headerName: intl.formatMessage(messages.quoteToGuess), width: 100 },
];

// REORDERING
const reorderingQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answerIdx?: number; items: unknown[]; title: string };
  return {
    title: q.title,
  };
};
const reorderingQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
];

type QuestionRowFn = (question: AnyBaseQuestion) => Record<string, unknown>;
type QuestionColumnsFn = (intl: IntlShape) => ColSpec[];

const questionTypeToRow: Record<string, QuestionRowFn> = {
  [QuestionType.BASIC]: basicQuestionRow,
  [QuestionType.BLINDTEST]: blindtestQuestionRow,
  [QuestionType.EMOJI]: emojiQuestionRow,
  [QuestionType.IMAGE]: imageQuestionRow,
  [QuestionType.ENUMERATION]: enumerationQuestionRow,
  [QuestionType.ESTIMATION]: estimationQuestionRow,
  [QuestionType.LABELLING]: labellingQuestionRow,
  [QuestionType.MATCHING]: matchingQuestionRow,
  [QuestionType.MCQ]: mcqQuestionRow,
  [QuestionType.NAGUI]: naguiQuestionRow,
  [QuestionType.ODD_ONE_OUT]: oddOneOutQuestionRow,
  [QuestionType.PROGRESSIVE_CLUES]: progressiveCluesQuestionRow,
  [QuestionType.QUOTE]: quoteQuestionRow,
  [QuestionType.REORDERING]: reorderingQuestionRow,
};

export const questionTypeToColumns: Record<string, QuestionColumnsFn> = {
  [QuestionType.BASIC]: basicQuestionColumns,
  [QuestionType.BLINDTEST]: blindtestQuestionColumns,
  [QuestionType.EMOJI]: emojiQuestionColumns,
  [QuestionType.IMAGE]: imageQuestionColumns,
  [QuestionType.ENUMERATION]: enumerationQuestionColumns,
  [QuestionType.ESTIMATION]: estimationQuestionColumns,
  [QuestionType.LABELLING]: labellingQuestionColumns,
  [QuestionType.MATCHING]: matchingQuestionColumns,
  [QuestionType.MCQ]: mcqQuestionColumns,
  [QuestionType.NAGUI]: naguiQuestionColumns,
  [QuestionType.ODD_ONE_OUT]: oddOneOutQuestionColumns,
  [QuestionType.PROGRESSIVE_CLUES]: progressiveCluesQuestionColumns,
  [QuestionType.QUOTE]: quoteQuestionColumns,
  [QuestionType.REORDERING]: reorderingQuestionColumns,
};

const commonQuestionRow = (question: AnyBaseQuestion, users: User[]) => {
  const q = question as {
    id: string;
    lang: string;
    topic: string;
    type: QuestionType;
    createdAt: FirestoreTimestamp | null | undefined;
    createdBy: string;
  };
  const { id, lang, topic, createdAt, createdBy } = q;

  const user = users.find((u) => u.id === createdBy);
  const { name, image } = user!;

  return {
    id,
    lang: localeToEmoji(lang as Locale),
    topic: topicToEmoji(topic as Topic),
    createdAt: timestampToDate1(createdAt),
    createdBy: {
      name,
      image,
    },
  };
};

export const questionRow = (question: AnyBaseQuestion, users: User[]): Row => {
  const commonInfo = commonQuestionRow(question, users);
  const typeSpecificInfo = questionTypeToRow[question.type](question);
  return { ...commonInfo, ...typeSpecificInfo };
};
