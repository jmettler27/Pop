import { timestampToDate, timestampToDate1 } from '@/backend/utils/time';
import { QUESTION_ELEMENT_TO_TITLE, ANSWER_TEXT } from '@/backend/utils/question/question';

import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';
import {
  QuoteQuestion,
  QuotePartElement,
  QuoteAuthorElement,
  QuoteSourceElement,
} from '@/backend/models/questions/Quote';
import { topicToEmoji } from '@/backend/models/Topic';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import { Avatar } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import React, { useState, useMemo, useCallback } from 'react';

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

const CLUE = {
  en: 'Clue',
  'fr-FR': 'Indice',
};

const TITLE = {
  en: 'Title',
  'fr-FR': 'Titre',
};

// PROGRESSIVE CLUES
const progressiveCluesQuestionRow = (question) => {
  const title = question.title;
  const answer = question.answer;
  const clues = question.clues;
  return {
    title,
    answer: answer.title,
  };
};
const progressiveCluesQuestionColumns = [
  { field: 'title', headerName: 'Question', width: 150 },
  { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
];

// IMAGE
const imageQuestionRow = (question) => {
  const title = question.title;
  const description = question.answer.description;
  const source = question.answer.source;
  return {
    title,
    description,
    source,
  };
};
const imageQuestionColumns = [
  { field: 'title', headerName: 'Question', width: 250 },
  { field: 'description', headerName: 'Description', width: 250 },
  { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 250 },
];

// EMOJI
const emojiQuestionRow = (question) => {
  const title = question.title;
  const answer = question.answer;
  const clue = question.clue;
  return {
    title,
    answer: answer.title,
    clue,
  };
};
const emojiQuestionColumns = [
  { field: 'title', headerName: 'Question', width: 225 },
  { field: 'answer', headerName: ANSWER_TEXT[DEFAULT_LOCALE], width: 225 },
  { field: 'clue', headerName: CLUE[DEFAULT_LOCALE], width: 200 },
];

// BLINDTEST
const blindtestQuestionRow = (question) => {
  const subtype = question.subtype;
  const title = question.title;
  const answer = question.answer;
  return {
    subtype: BlindtestQuestion.typeToEmoji(subtype),
    title,
    answer_source: answer.source,
    answer_author: answer.author,
    answer_title: answer.title,
  };
};
const blindtestQuestionColumns = [
  { field: 'subtype', headerName: 'Type', width: 100 },
  { field: 'title', headerName: 'Question', width: 150 },
  { field: 'answer_source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'answer_author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'answer_title', headerName: TITLE[DEFAULT_LOCALE], width: 200 },
];

// ENUM
const enumQuestionRow = (question) => {
  const title = question.title;
  const note = question.note;
  const answer = question.answer;
  const maxIsKnown = question.maxIsKnown;
  const thinkingTime = question.thinkingTime;
  const challengeTime = question.challengeTime;
  return {
    title,
    note,
    numAnswers: maxIsKnown ? answer.length : '>= ' + answer.length,
    thinkingTime,
    challengeTime,
  };
};
const ENUM_NUM_ANSWERS = {
  en: 'Answers',
  'fr-FR': 'Réponses',
};
const ENUM_THINKING = {
  en: 'Thinking (s)',
  'fr-FR': 'Réflexion (s)',
};
const enumQuestionColumns = [
  { field: 'title', headerName: 'Question', width: 400 },
  { field: 'note', headerName: 'Note', width: 250 },
  { field: 'numAnswers', headerName: ENUM_NUM_ANSWERS[DEFAULT_LOCALE], width: 100 },
  { field: 'thinkingTime', headerName: ENUM_THINKING[DEFAULT_LOCALE], width: 100 },
  { field: 'challengeTime', headerName: 'Challenge (s)', width: 100 },
];

// ODD ONE OUT
const oddOneOutQuestionRow = (question) => {
  const answerIdx = question.answerIdx;
  const items = question.items;
  const title = question.title;
  return {
    title,
    oddOneOut: items[answerIdx].title,
  };
};
const ODD_ONE_OUT = {
  en: 'Odd one out',
  'fr-FR': 'Intrus',
};
const oddOneOutQuestionColumns = [
  { field: 'title', headerName: 'Question', width: 500 },
  { field: 'oddOneOut', headerName: ODD_ONE_OUT[DEFAULT_LOCALE], width: 250 },
];

// MATCHING
const matchingQuestionRow = (question) => {
  const title = question.title;
  const numCols = question.numCols;
  const numRows = question.numRows;
  return {
    title,
    numCols,
    numRows,
  };
};
const MATCHING_COLUMNS = {
  en: 'Columns',
  'fr-FR': 'Colonnes',
};
const matchingQuestionColumns = [
  { field: 'title', headerName: 'Question', width: 500 },
  { field: 'numCols', headerName: MATCHING_COLUMNS[DEFAULT_LOCALE], width: 100 },
  { field: 'numRows', headerName: 'Matches', width: 100 },
];

// QUOTE
const quoteQuestionRow = (question) => {
  const author = question.author;
  const quote = question.quote;
  const source = question.source;
  const toGuess = question.toGuess;

  const sortedToGuess = toGuess.sort((a, b) => {
    return QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(a) - QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(b);
  });
  const toGuessWithEmojis = sortedToGuess.map((item) => QuoteQuestion.elementToEmoji(item)).join(', ');

  return {
    author,
    quote: `"${quote}"`,
    source,
    toGuess: toGuessWithEmojis,
  };
};
const QUOTE = {
  en: 'Quote',
  'fr-FR': 'Réplique',
};
const QUOTE_TO_GUESS = {
  en: 'To guess',
  'fr-FR': 'À deviner',
};
const quoteQuestionColumns = [
  { field: 'source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'quote', headerName: QUOTE[DEFAULT_LOCALE], width: 500 },
  { field: 'toGuess', headerName: QUOTE_TO_GUESS[DEFAULT_LOCALE], width: 100 },
];

// LABEL
const labelQuestionRow = (question) => {
  const title = question.title;
  const labels = question.labels;

  return {
    numLabels: labels.length,
    title,
  };
};

const NUM_LABELS = {
  en: 'Labels',
  'fr-FR': 'Étiquettes',
};

const labelQuestionColumns = [
  { field: 'numLabels', headerName: NUM_LABELS[DEFAULT_LOCALE], width: 100 },
  { field: 'title', headerName: 'Question', width: 400 },
];

// ODD ONE OUT
const reorderingQuestionRow = (question) => {
  const answerIdx = question.answerIdx;
  const items = question.items;
  const title = question.title;
  return {
    title,
  };
};
const reorderingQuestionColumns = [{ field: 'title', headerName: 'Question', width: 500 }];

// MCQ
const mcqQuestionRow = (question) => {
  const answerIdx = question.answerIdx;
  const choices = question.choices;
  const explanation = question.explanation;
  const note = question.note;
  const source = question.source;
  const title = question.title;
  return {
    numChoices: choices.length,
    answer: choices[answerIdx],
    // explanation,
    // note,
    source,
    title,
  };
};

const NUM_CHOICES = {
  en: 'Choices',
  'fr-FR': 'Choix',
};

const mcqQuestionColumns = [
  { field: 'numChoices', headerName: NUM_CHOICES[DEFAULT_LOCALE], width: 75 },
  { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 200 },
  { field: 'title', headerName: 'Question', width: 500 },
  // { field: 'note', headerName: 'Note', width: MCQ_NOTE_MAX_LENGTH * 6 },
  { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
  // { field: 'explanation', headerName: 'Explanation', width: 130 },
];

// NAGUI
const naguiQuestionRow = (question) => {
  const answerIdx = question.answerIdx;
  const choices = question.choices;
  const explanation = question.explanation;
  const note = question.note;
  const source = question.source;
  const title = question.title;
  return {
    answer: choices[answerIdx],
    // explanation,
    // note,
    source,
    title,
  };
};
const naguiQuestionColumns = [
  { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 200 },
  { field: 'title', headerName: 'Question', width: 500 },
  // { field: 'note', headerName: 'Note', width: NAGUI_NOTE_MAX_LENGTH * 6 },
  { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
  // { field: 'explanation', headerName: 'Explanation', width: 130 },
];

// BASIC
const basicQuestionRow = (question) => {
  const answer = question.answer;
  const explanation = question.explanation;
  const note = question.note;
  const source = question.source;
  const title = question.title;
  return {
    answer,
    // explanation,
    // note,
    source,
    title,
  };
};
const basicQuestionColumns = [
  { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 200 },
  { field: 'title', headerName: 'Question', width: 500 },
  // { field: 'note', headerName: 'Note', width: MCQ_NOTE_MAX_LENGTH * 6 },
  { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
  // { field: 'explanation', headerName: 'Explanation', width: 130 },
];

import { QuestionType } from '@/backend/models/questions/QuestionType';
import UserRepository from '@/backend/repositories/user/UserRepository';
import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';

const questionTypeToRow = {
  [QuestionType.PROGRESSIVE_CLUES]: progressiveCluesQuestionRow,
  [QuestionType.IMAGE]: imageQuestionRow,
  [QuestionType.EMOJI]: emojiQuestionRow,
  [QuestionType.BLINDTEST]: blindtestQuestionRow,
  [QuestionType.ENUMERATION]: enumQuestionRow,
  [QuestionType.ODD_ONE_OUT]: oddOneOutQuestionRow,
  [QuestionType.MATCHING]: matchingQuestionRow,
  [QuestionType.QUOTE]: quoteQuestionRow,
  [QuestionType.LABELLING]: labelQuestionRow,
  [QuestionType.REORDERING]: reorderingQuestionRow,
  [QuestionType.MCQ]: mcqQuestionRow,
  [QuestionType.NAGUI]: naguiQuestionRow,
  [QuestionType.BASIC]: basicQuestionRow,
};

const questionTypeToColumns = {
  [QuestionType.PROGRESSIVE_CLUES]: progressiveCluesQuestionColumns,
  [QuestionType.IMAGE]: imageQuestionColumns,
  [QuestionType.EMOJI]: emojiQuestionColumns,
  [QuestionType.BLINDTEST]: blindtestQuestionColumns,
  [QuestionType.ENUMERATION]: enumQuestionColumns,
  [QuestionType.ODD_ONE_OUT]: oddOneOutQuestionColumns,
  [QuestionType.MATCHING]: matchingQuestionColumns,
  [QuestionType.QUOTE]: quoteQuestionColumns,
  [QuestionType.LABELLING]: labelQuestionColumns,
  [QuestionType.REORDERING]: reorderingQuestionColumns,
  [QuestionType.MCQ]: mcqQuestionColumns,
  [QuestionType.NAGUI]: naguiQuestionColumns,
  [QuestionType.BASIC]: basicQuestionColumns,
};

const commonQuestionRow = (question, users) => {
  const { id, lang, topic, type, createdAt, createdBy } = question;

  const user = users.find((user) => user.id === createdBy);
  const { name, image } = user;

  return {
    id,
    lang: localeToEmoji(lang),
    topic: topicToEmoji(topic),
    // type: prependQuestionTypeWithEmoji(type, lang),
    createdAt: timestampToDate1(createdAt, lang),
    createdBy: {
      name,
      image,
    },
  };
};

const questionColumns = (questionType, lang = DEFAULT_LOCALE) => {
  return [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'lang', headerName: 'Lang', width: 50 },
    { field: 'topic', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['topic'], width: 75 },
    ...questionTypeToColumns[questionType],
    { field: 'createdAt', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['createdAt'], width: 130 },
    {
      field: 'createdBy',
      headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['createdBy'],
      width: 130,
      renderCell: (params) => (
        <div className="flex flex-row w-full space-x-2 items-center">
          <Avatar src={params.row.createdBy.image} variant="rounded" sx={{ width: 30, height: 30 }} />
          <span>{params.row.createdBy.name}</span>
        </div>
      ),
    },
  ];
};

const questionRow = (question, users) => {
  const commonInfo = commonQuestionRow(question, users);
  const typeSpecificInfo = questionTypeToRow[question.type](question);
  return { ...commonInfo, ...typeSpecificInfo };
};

function SearchQuestionDataGridImpl({
  questionType,
  questionSelectionModel = [],
  onQuestionSelectionModelChange = () => {},
}) {
  // Create repository instances with memoization to prevent unnecessary recreations
  const userRepo = useMemo(() => new UserRepository(), []);
  const { users, loading: usersLoading, error: usersError } = userRepo.useAllUsersOnce();

  // Memoize repository instance based on questionType to prevent re-fetching when other props change
  const questionRepo = useMemo(() => new BaseQuestionRepository(questionType), [questionType]);
  const { baseQuestions, baseQuestionsLoading, baseQuestionsError } = questionRepo.useQuestionsOnce(true);

  // Stabilize callback reference to prevent unnecessary child re-renders
  const memoizedOnSelectionChange = useCallback(onQuestionSelectionModelChange, [onQuestionSelectionModelChange]);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 20,
    page: 0,
  });

  if (usersError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(usersError)}</strong>
      </p>
    );
  }
  if (baseQuestionsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(baseQuestionsError)}</strong>
      </p>
    );
  }
  if (usersLoading || baseQuestionsLoading) {
    return <LoadingScreen loadingText="Loading questions and users..." />;
  }
  if (!users || !baseQuestions) {
    return <></>;
  }

  console.log('Loaded questions:', baseQuestions);

  const rows = baseQuestions.map((question) => questionRow(question, users));
  const columns = questionColumns(questionType);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        onRowSelectionModelChange={memoizedOnSelectionChange}
        rowSelectionModel={questionSelectionModel}
        pageSizeOptions={[10, 20, 50, 100]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        checkboxSelection
        disableSelectionOnClick
        density="compact"
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e0e0e0',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-footerContainer': {
            backgroundColor: '#f5f5f5',
          },
        }}
      />
    </div>
  );
}

// Memoize the component to prevent re-renders when parent state changes
// Only re-renders when props actually change
export const SearchQuestionDataGrid = React.memo(SearchQuestionDataGridImpl, (prevProps, nextProps) => {
  return (
    prevProps.questionType === nextProps.questionType &&
    prevProps.questionSelectionModel === nextProps.questionSelectionModel &&
    prevProps.onQuestionSelectionModelChange === nextProps.onQuestionSelectionModelChange
  );
});
