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

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.questions.QuestionDataGrid', {
  clue: 'Clue',
  title: 'Title',
  enumAnswers: 'Answers',
  enumThinking: 'Thinking (s)',
  oddOneOut: 'Odd one out',
  matchingColumns: 'Columns',
  quote: 'Quote',
  quoteToGuess: 'To guess',
  numLabels: 'Labels',
  choices: 'Choices',
});

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
const progressiveCluesQuestionColumns = (intl) => [
  { field: 'title', headerName: 'Question', width: 150 },
  {
    field: 'answer',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['answer'] ?? QUESTION_ELEMENT_TO_TITLE['en']['answer'],
    width: 250,
  },
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
const imageQuestionColumns = (intl) => [
  { field: 'title', headerName: 'Question', width: 250 },
  { field: 'description', headerName: 'Description', width: 250 },
  {
    field: 'source',
    headerName: QUESTION_ELEMENT_TO_TITLE[intl.locale]?.['source'] ?? QUESTION_ELEMENT_TO_TITLE['en']['source'],
    width: 250,
  },
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
const emojiQuestionColumns = (intl) => [
  { field: 'title', headerName: 'Question', width: 225 },
  { field: 'answer', headerName: ANSWER_TEXT[intl.locale] ?? ANSWER_TEXT['en'], width: 225 },
  { field: 'clue', headerName: intl.formatMessage(messages.clue), width: 200 },
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
const blindtestQuestionColumns = (intl) => [
  { field: 'subtype', headerName: 'Type', width: 100 },
  { field: 'title', headerName: 'Question', width: 150 },
  { field: 'answer_source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'answer_author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'answer_title', headerName: intl.formatMessage(messages.title), width: 200 },
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
const enumQuestionColumns = (intl) => [
  { field: 'title', headerName: 'Question', width: 400 },
  { field: 'note', headerName: 'Note', width: 250 },
  { field: 'numAnswers', headerName: intl.formatMessage(messages.enumAnswers), width: 100 },
  { field: 'thinkingTime', headerName: intl.formatMessage(messages.enumThinking), width: 100 },
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
const oddOneOutQuestionColumns = (intl) => [
  { field: 'title', headerName: 'Question', width: 500 },
  { field: 'oddOneOut', headerName: intl.formatMessage(messages.oddOneOut), width: 250 },
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
const matchingQuestionColumns = (intl) => [
  { field: 'title', headerName: 'Question', width: 500 },
  { field: 'numCols', headerName: intl.formatMessage(messages.matchingColumns), width: 100 },
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
const quoteQuestionColumns = (intl) => [
  { field: 'source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
  { field: 'author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
  { field: 'quote', headerName: intl.formatMessage(messages.quote), width: 500 },
  { field: 'toGuess', headerName: intl.formatMessage(messages.quoteToGuess), width: 100 },
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

const labelQuestionColumns = (intl) => [
  { field: 'numLabels', headerName: intl.formatMessage(messages.numLabels), width: 100 },
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

const mcqQuestionColumns = (intl) => [
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
const naguiQuestionColumns = (intl) => [
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
const basicQuestionColumns = (intl) => [
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

const questionColumns = (questionType, intl) => {
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

  const intl = useIntl();
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
