import type { IntlShape } from 'react-intl';

import { localeToEmoji } from '@/frontend/helpers/locales';
import { timestampToDate, type FirestoreTimestamp } from '@/frontend/helpers/time';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { BasicQuestion } from '@/models/questions/basic';
import { BlindtestQuestion, blindtestTypeToEmoji } from '@/models/questions/blindtest';
import { EmojiQuestion } from '@/models/questions/emoji';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { EstimationQuestion } from '@/models/questions/estimation';
import { ImageQuestion } from '@/models/questions/image';
import { LabellingQuestion } from '@/models/questions/labelling';
import { MatchingQuestion } from '@/models/questions/matching';
import { MCQQuestion } from '@/models/questions/mcq';
import { NaguiQuestion } from '@/models/questions/nagui';
import { OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { BaseQuestion } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';
import type { AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import { QuoteAuthorElement, QuotePartElement, QuoteQuestion, QuoteSourceElement } from '@/models/questions/quote';
import { ReorderingQuestion } from '@/models/questions/reordering';
import { topicToEmoji } from '@/models/topic';

/** Minimal user shape the rows need — just the author's display fields. */
type RowUser = { id?: string; name: string; image?: string | null };

export const messages = defineMessages('frontend.questions.QuestionSearchTable', {
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
const progressiveCluesQuestionRow = (question: ProgressiveCluesQuestion) => ({
  title: question.title,
  answer: question.answer.title,
});
const progressiveCluesQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 150 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 250 },
];

// BASIC
const basicQuestionRow = (question: BasicQuestion) => ({
  answer: question.answer,
  source: question.source,
  title: question.title,
});
const basicQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 200 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 250 },
];

// BLINDTEST
const blindtestQuestionRow = (question: BlindtestQuestion) => ({
  subtype: blindtestTypeToEmoji(question.subtype),
  title: question.title,
  answer_source: question.answer.source,
  answer_author: question.answer.author,
  answer_title: question.answer.title,
});
const blindtestQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'subtype', headerName: intl.formatMessage(messages.type), width: 100 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 150 },
  { field: 'answer_source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'answer_author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'answer_title', headerName: intl.formatMessage(messages.title), width: 200 },
];

// EMOJI
const emojiQuestionRow = (question: EmojiQuestion) => ({
  title: question.title,
  answer: question.answer.title,
  clue: question.clue,
});
const emojiQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 225 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 225 },
  { field: 'clue', headerName: intl.formatMessage(globalMessages.clue), width: 200 },
];

// ENUMERATION
const enumerationQuestionRow = (question: EnumerationQuestion) => {
  const answer = question.answer ?? [];
  return {
    title: question.title,
    numAnswers: question.maxIsKnown ? answer.length : '>= ' + answer.length,
    thinkingTime: question.thinkingTime,
    challengeTime: question.challengeTime,
  };
};
const enumerationQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 400 },
  { field: 'numAnswers', headerName: intl.formatMessage(messages.enumAnswers), width: 150 },
  { field: 'thinkingTime', headerName: intl.formatMessage(messages.enumThinking), width: 150 },
  { field: 'challengeTime', headerName: intl.formatMessage(messages.challengeTime), width: 150 },
];

// ESTIMATION
const estimationQuestionRow = (question: EstimationQuestion) => ({
  answer: question.answer,
  source: question.source,
  title: question.title,
});
const estimationQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 200 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 500 },
];

// IMAGE
const imageQuestionRow = (question: ImageQuestion) => ({
  title: question.title,
  description: question.answer.description,
  source: question.answer.source,
});
const imageQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'description', headerName: intl.formatMessage(messages.description), width: 500 },
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 300 },
];

// LABELLING
const labellingQuestionRow = (question: LabellingQuestion) => ({
  numLabels: (question.labels ?? []).length,
  title: question.title,
});
const labellingQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'numLabels', headerName: intl.formatMessage(messages.numLabels), width: 150 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
];

// MATCHING
const matchingQuestionRow = (question: MatchingQuestion) => ({
  title: question.title,
  numCols: question.numCols,
  numRows: question.numRows,
});
const matchingQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'numCols', headerName: intl.formatMessage(messages.matchingColumns), width: 150 },
  { field: 'numRows', headerName: intl.formatMessage(messages.matches), width: 150 },
];

// MCQ
const mcqQuestionRow = (question: MCQQuestion) => {
  const choices = question.choices ?? [];
  return {
    numChoices: choices.length,
    answer: question.answerIdx !== undefined ? choices[question.answerIdx] : undefined,
    source: question.source,
    title: question.title,
  };
};
const mcqQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'numChoices', headerName: intl.formatMessage(messages.choices), width: 150 },
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 300 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 500 },
];

// NAGUI
const naguiQuestionRow = (question: NaguiQuestion) => {
  const choices = question.choices ?? [];
  return {
    answer: question.answerIdx !== undefined ? choices[question.answerIdx] : undefined,
    source: question.source,
    title: question.title,
  };
};
const naguiQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'source', headerName: intl.formatMessage(messages.source), width: 300 },
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 500 },
];

// ODD ONE OUT
const oddOneOutQuestionRow = (question: OddOneOutQuestion) => ({
  title: question.title,
  oddOneOut: question.answerIdx !== undefined ? question.items?.[question.answerIdx]?.title : undefined,
});
const oddOneOutQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
  { field: 'oddOneOut', headerName: intl.formatMessage(messages.oddOneOut), width: 250 },
];

// QUOTE
const quoteQuestionRow = (question: QuoteQuestion) => {
  const sortedToGuess = [...(question.toGuess ?? [])].sort((a, b) => {
    return QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(a) - QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(b);
  });
  const quoteElementEmoji: Record<string, string> = {
    [QuoteSourceElement.TYPE]: QuoteSourceElement.TYPE_TO_EMOJI,
    [QuoteAuthorElement.TYPE]: QuoteAuthorElement.TYPE_TO_EMOJI,
    [QuotePartElement.TYPE]: QuotePartElement.TYPE_TO_EMOJI,
  };
  const toGuessWithEmojis = sortedToGuess.map((item) => quoteElementEmoji[item] ?? item).join(', ');

  return {
    author: question.author,
    quote: `"${question.quote ?? ''}"`,
    source: question.source,
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
const reorderingQuestionRow = (question: ReorderingQuestion) => ({
  title: question.title,
});
const reorderingQuestionColumns = (intl: IntlShape): ColSpec[] => [
  { field: 'title', headerName: intl.formatMessage(globalMessages.question), width: 500 },
];

type QuestionColumnsFn = (intl: IntlShape) => ColSpec[];

export const questionTypeToColumns: Record<QuestionType, QuestionColumnsFn> = {
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

// Each branch narrows `question` to its real model class via `instanceof`, so every xxxQuestionRow
// above takes its own concrete class instead of re-declaring an ad-hoc, easily-stale inline shape.
// AnyBaseQuestion also includes the abstract BuzzerQuestion itself (a preexisting QuestionFactory
// quirk), so this can't narrow all the way to `never` and end in a compile-checked exhaustiveness
// assertion — the trailing throw is the runtime safety net instead.
function questionFields(question: AnyBaseQuestion): Row {
  if (question instanceof BasicQuestion) return basicQuestionRow(question);
  if (question instanceof BlindtestQuestion) return blindtestQuestionRow(question);
  if (question instanceof EmojiQuestion) return emojiQuestionRow(question);
  if (question instanceof EnumerationQuestion) return enumerationQuestionRow(question);
  if (question instanceof EstimationQuestion) return estimationQuestionRow(question);
  if (question instanceof ImageQuestion) return imageQuestionRow(question);
  if (question instanceof LabellingQuestion) return labellingQuestionRow(question);
  if (question instanceof MatchingQuestion) return matchingQuestionRow(question);
  if (question instanceof MCQQuestion) return mcqQuestionRow(question);
  if (question instanceof NaguiQuestion) return naguiQuestionRow(question);
  if (question instanceof OddOneOutQuestion) return oddOneOutQuestionRow(question);
  if (question instanceof ProgressiveCluesQuestion) return progressiveCluesQuestionRow(question);
  if (question instanceof QuoteQuestion) return quoteQuestionRow(question);
  if (question instanceof ReorderingQuestion) return reorderingQuestionRow(question);
  throw new Error(`Unhandled question type: ${question.type}`);
}

const commonQuestionFields = (question: BaseQuestion, intl: IntlShape, users: RowUser[]): Row => {
  const user = users.find((u) => u.id === question.createdBy);
  const { name, image } = user ?? { name: '', image: null };
  const createdAt = timestampToDate(question.createdAt as FirestoreTimestamp | null | undefined);

  return {
    id: question.id,
    lang: question.lang ? localeToEmoji(question.lang) : undefined,
    topic: question.topic ? topicToEmoji(question.topic) : undefined,
    // Locale-ordered numeric parts, `-`-joined (e.g. `29-08-2026` / `08-29-2026`).
    createdAt: createdAt
      ? intl
          .formatDateToParts(createdAt, { format: 'numeric' })
          .filter((part) => part.type === 'year' || part.type === 'month' || part.type === 'day')
          .map((part) => part.value)
          .join('-')
      : null,
    createdBy: { name, image },
  };
};

export const questionRow = (question: AnyBaseQuestion, intl: IntlShape, users: RowUser[]): Row => ({
  ...commonQuestionFields(question, intl, users),
  ...questionFields(question),
});
