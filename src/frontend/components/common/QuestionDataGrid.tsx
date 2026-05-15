import { memo, useCallback, useMemo, useState } from 'react';

import { Avatar, CircularProgress } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import UserRepository from '@/backend/repositories/user/UserRepository';
import type { Locale } from '@/frontend/helpers/locales';
import { localeToEmoji } from '@/frontend/helpers/locales';
import { QUESTION_ELEMENT_TO_TITLE } from '@/frontend/helpers/question';
import { timestampToDate1, type FirestoreTimestamp } from '@/frontend/helpers/time';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { BlindtestQuestion } from '@/models/questions/blindtest';
import { QuestionType } from '@/models/questions/question-type';
import type { AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import { QuoteAuthorElement, QuotePartElement, QuoteQuestion, QuoteSourceElement } from '@/models/questions/quote';
import { topicToEmoji, type Topic } from '@/models/topic';
import User from '@/models/users/user';

const messages = defineMessages('frontend.questions.QuestionDataGrid', {
  title: 'Title',
  enumAnswers: 'Answers',
  enumThinking: 'Thinking (s)',
  oddOneOut: 'Odd one out',
  matchingColumns: 'Columns',
  quoteToGuess: 'To guess',
  numLabels: 'Labels',
  choices: 'Choices',
});

// PROGRESSIVE CLUES
const progressiveCluesQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; answer: { title: string }; clues: string[] };
  return {
    title: q.title,
    answer: q.answer.title,
  };
};
const progressiveCluesQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'title', headerName: 'Question', width: 150 },
  {
    field: 'answer',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['answer'] ?? QUESTION_ELEMENT_TO_TITLE['en']['answer'],
    width: 250,
  },
];

// BASIC
const basicQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answer: string; explanation?: string; note?: string; source?: string; title: string };
  return {
    answer: q.answer,
    source: q.source,
    title: q.title,
  };
};
const basicQuestionColumns = (intl: IntlShape): GridColDef[] => [
  {
    field: 'source',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['source'] ?? QUESTION_ELEMENT_TO_TITLE['en']['source'],
    width: 200,
  },
  { field: 'title', headerName: 'Question', width: 500 },
  {
    field: 'answer',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['answer'] ?? QUESTION_ELEMENT_TO_TITLE['en']['answer'],
    width: 250,
  },
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
const blindtestQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'subtype', headerName: 'Type', width: 100 },
  { field: 'title', headerName: 'Question', width: 150 },
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
const emojiQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'title', headerName: 'Question', width: 225 },
  { field: 'answer', headerName: intl.formatMessage(globalMessages.answer), width: 225 },
  { field: 'clue', headerName: intl.formatMessage(globalMessages.clue), width: 200 },
];

// ENUMERATION
const enumerationQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as {
    title: string;
    note?: string;
    answer: string[];
    maxIsKnown: boolean;
    thinkingTime?: number;
    challengeTime?: number;
  };
  return {
    title: q.title,
    note: q.note,
    numAnswers: q.maxIsKnown ? q.answer.length : '>= ' + q.answer.length,
    thinkingTime: q.thinkingTime,
    challengeTime: q.challengeTime,
  };
};
const enumerationQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'title', headerName: 'Question', width: 400 },
  { field: 'note', headerName: 'Note', width: 250 },
  { field: 'numAnswers', headerName: intl.formatMessage(messages.enumAnswers), width: 100 },
  { field: 'thinkingTime', headerName: intl.formatMessage(messages.enumThinking), width: 100 },
  { field: 'challengeTime', headerName: 'Challenge (s)', width: 100 },
];

// ESTIMATION
const estimationQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answer: unknown; explanation?: string; note?: string; source?: string; title: string };
  return {
    answer: q.answer,
    source: q.source,
    title: q.title,
  };
};
const estimationQuestionColumns = (intl: IntlShape): GridColDef[] => [
  {
    field: 'source',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['source'] ?? QUESTION_ELEMENT_TO_TITLE['en']['source'],
    width: 200,
  },
  { field: 'title', headerName: 'Question', width: 500 },
  {
    field: 'answer',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['answer'] ?? QUESTION_ELEMENT_TO_TITLE['en']['answer'],
    width: 250,
  },
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
const imageQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'title', headerName: 'Question', width: 250 },
  { field: 'description', headerName: 'Description', width: 250 },
  {
    field: 'source',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['source'] ?? QUESTION_ELEMENT_TO_TITLE['en']['source'],
    width: 250,
  },
];

// LABELLING
const labellingQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; labels: string[] };
  return {
    numLabels: q.labels.length,
    title: q.title,
  };
};
const labellingQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'numLabels', headerName: intl.formatMessage(messages.numLabels), width: 100 },
  { field: 'title', headerName: 'Question', width: 400 },
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
const matchingQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'title', headerName: 'Question', width: 500 },
  { field: 'numCols', headerName: intl.formatMessage(messages.matchingColumns), width: 100 },
  { field: 'numRows', headerName: 'Matches', width: 100 },
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
const mcqQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'numChoices', headerName: intl.formatMessage(messages.choices), width: 75 },
  {
    field: 'source',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['source'] ?? QUESTION_ELEMENT_TO_TITLE['en']['source'],
    width: 200,
  },
  { field: 'title', headerName: 'Question', width: 500 },
  {
    field: 'answer',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['answer'] ?? QUESTION_ELEMENT_TO_TITLE['en']['answer'],
    width: 250,
  },
];

// NAGUI
const naguiQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as {
    answerIdx: number;
    choices: string[];
    explanation?: string;
    note?: string;
    source?: string;
    title: string;
  };
  return {
    answer: q.choices[q.answerIdx],
    source: q.source,
    title: q.title,
  };
};
const naguiQuestionColumns = (intl: IntlShape): GridColDef[] => [
  {
    field: 'source',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['source'] ?? QUESTION_ELEMENT_TO_TITLE['en']['source'],
    width: 200,
  },
  { field: 'title', headerName: 'Question', width: 500 },
  {
    field: 'answer',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['answer'] ?? QUESTION_ELEMENT_TO_TITLE['en']['answer'],
    width: 250,
  },
];

// ODD ONE OUT
const oddOneOutQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { answerIdx: number; items: Array<{ title: string }>; title: string };
  return {
    title: q.title,
    oddOneOut: q.items[q.answerIdx].title,
  };
};
const oddOneOutQuestionColumns = (intl: IntlShape): GridColDef[] => [
  { field: 'title', headerName: 'Question', width: 500 },
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
const quoteQuestionColumns = (intl: IntlShape): GridColDef[] => [
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
const reorderingQuestionColumns: GridColDef[] = [{ field: 'title', headerName: 'Question', width: 500 }];

type QuestionRowFn = (question: AnyBaseQuestion) => Record<string, unknown>;
type QuestionColumnsFn = ((intl: IntlShape) => GridColDef[]) | GridColDef[];

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

const questionTypeToColumns: Record<string, QuestionColumnsFn> = {
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

const questionColumns = (questionType: QuestionType, intl: IntlShape): GridColDef[] => {
  const typeSpecificCols = questionTypeToColumns[questionType];
  const cols = typeof typeSpecificCols === 'function' ? typeSpecificCols(intl) : typeSpecificCols;
  const dict = QUESTION_ELEMENT_TO_TITLE[intl.locale] ?? QUESTION_ELEMENT_TO_TITLE['en'];
  return [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'lang', headerName: 'Lang', width: 50 },
    { field: 'topic', headerName: dict['topic'], width: 75 },
    ...cols,
    { field: 'createdAt', headerName: dict['createdAt'], width: 130 },
    {
      field: 'createdBy',
      headerName: dict['createdBy'],
      width: 130,
      renderCell: (params) => (
        <div className="flex flex-row w-full space-x-2 items-center">
          <Avatar
            src={(params.row as { createdBy: { image?: string } }).createdBy.image}
            variant="rounded"
            sx={{ width: 30, height: 30 }}
          />
          <span>{(params.row as { createdBy: { name: string } }).createdBy.name}</span>
        </div>
      ),
    },
  ];
};

const questionRow = (question: AnyBaseQuestion, users: User[]) => {
  const commonInfo = commonQuestionRow(question, users);
  const typeSpecificInfo = questionTypeToRow[question.type](question);
  return { ...commonInfo, ...typeSpecificInfo };
};

interface SearchQuestionDataGridProps {
  questionType: QuestionType;
  questionSelectionModel?: GridRowSelectionModel;
  onQuestionSelectionModelChange?: (model: GridRowSelectionModel) => void;
}

function SearchQuestionDataGridImpl({
  questionType,
  questionSelectionModel = [],
  onQuestionSelectionModelChange = () => {},
}: SearchQuestionDataGridProps) {
  const intl = useIntl();

  // Create repository instances with memoization to prevent unnecessary recreations
  const userRepo = useMemo(() => new UserRepository(), []);
  const { users, loading: usersLoading, error: usersError } = userRepo.useAllUsersOnce();

  // Memoize repository instance based on questionType to prevent re-fetching when other props change
  const questionRepo = useMemo(() => new BaseQuestionRepository(questionType as QuestionType), [questionType]);
  const { baseQuestions, baseQuestionsLoading, baseQuestionsError } = questionRepo.useQuestionsOnce(true);

  // Stabilize callback reference to prevent unnecessary child re-renders
  const memoizedOnSelectionChange = useCallback(onQuestionSelectionModelChange, [onQuestionSelectionModelChange]);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: 20,
    page: 0,
  });

  if (usersError || baseQuestionsError) {
    return <></>;
  }
  if (usersLoading || baseQuestionsLoading) {
    return <CircularProgress />;
  }
  if (!users || !baseQuestions) {
    return <></>;
  }

  const rows = baseQuestions.map((question) => questionRow(question, users));
  const columns = questionColumns(questionType, intl);

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
        disableRowSelectionOnClick
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
export const SearchQuestionDataGrid = memo<SearchQuestionDataGridProps>(
  SearchQuestionDataGridImpl,
  (prevProps, nextProps) => {
    return (
      prevProps.questionType === nextProps.questionType &&
      prevProps.questionSelectionModel === nextProps.questionSelectionModel &&
      prevProps.onQuestionSelectionModelChange === nextProps.onQuestionSelectionModelChange
    );
  }
);
