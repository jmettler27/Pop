import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import type { Column, ColumnDef, PaginationState, RowSelectionState, SortingState } from '@tanstack/react-table';
import {
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import UserRepository from '@/backend/repositories/user/UserRepository';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { Button } from '@/frontend/components/ui/button';
import { Checkbox } from '@/frontend/components/ui/checkbox';
import { Input } from '@/frontend/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { Spinner } from '@/frontend/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/frontend/components/ui/table';
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
  search: 'Search…',
  rowsPerPage: 'Rows per page',
  pageOf: 'Page {page} of {total}',
});

// A column spec, structurally identical to the old MUI GridColDef shape (field/headerName/width)
// so the 14 per-question-type builders below stay near-identical to their MUI-era form.
interface ColSpec {
  field: string;
  headerName: string;
  width: number;
}

type Row = Record<string, unknown>;

const tableFeaturesConfig = tableFeatures({
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

type Features = typeof tableFeaturesConfig;

// PROGRESSIVE CLUES
const progressiveCluesQuestionRow = (question: AnyBaseQuestion) => {
  const q = question as { title: string; answer: { title: string }; clues: string[] };
  return {
    title: q.title,
    answer: q.answer.title,
  };
};
const progressiveCluesQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const basicQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const blindtestQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const emojiQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const enumerationQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const estimationQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const imageQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const labellingQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const matchingQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const mcqQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const naguiQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const oddOneOutQuestionColumns = (intl: IntlShape): ColSpec[] => [
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
const reorderingQuestionColumns: ColSpec[] = [{ field: 'title', headerName: 'Question', width: 500 }];

type QuestionRowFn = (question: AnyBaseQuestion) => Record<string, unknown>;
type QuestionColumnsFn = ((intl: IntlShape) => ColSpec[]) | ColSpec[];

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

// Clickable header used by every column: toggles TanStack sorting and shows the current direction.
function SortableHeader({ label, column }: { label: string; column: Column<Features, Row, unknown> }) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:text-foreground/80"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {sorted === 'asc' && <ChevronUp className="size-3.5" />}
      {sorted === 'desc' && <ChevronDown className="size-3.5" />}
      {!sorted && <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />}
    </button>
  );
}

function sortableHeader(label: string) {
  return function Header({ column }: { column: Column<Features, Row, unknown> }) {
    return <SortableHeader label={label} column={column} />;
  };
}

const toColumnDefs = (specs: ColSpec[]): ColumnDef<Features, Row>[] =>
  specs.map((spec) => ({
    accessorKey: spec.field,
    header: sortableHeader(spec.headerName),
    size: spec.width,
  }));

const selectColumn: ColumnDef<Features, Row> = {
  id: 'select',
  size: 40,
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(checked) => row.toggleSelected(checked)}
      aria-label="Select row"
    />
  ),
};

const questionColumns = (questionType: QuestionType, intl: IntlShape): ColumnDef<Features, Row>[] => {
  const typeSpecificCols = questionTypeToColumns[questionType];
  const cols = typeof typeSpecificCols === 'function' ? typeSpecificCols(intl) : typeSpecificCols;
  const dict = QUESTION_ELEMENT_TO_TITLE[intl.locale] ?? QUESTION_ELEMENT_TO_TITLE['en'];
  return [
    { accessorKey: 'id', header: sortableHeader('ID'), size: 100 },
    { accessorKey: 'lang', header: sortableHeader('Lang'), size: 50 },
    { accessorKey: 'topic', header: sortableHeader(dict['topic']), size: 75 },
    ...toColumnDefs(cols),
    { accessorKey: 'createdAt', header: sortableHeader(dict['createdAt']), size: 130 },
    {
      id: 'createdBy',
      accessorFn: (row) => (row.createdBy as { name: string }).name,
      header: sortableHeader(dict['createdBy']),
      size: 130,
      cell: ({ row }) => {
        const createdBy = row.original.createdBy as { name: string; image?: string };
        return (
          <div className="flex flex-row items-center space-x-2">
            <Avatar className="size-[30px]">
              <AvatarImage src={createdBy.image} alt={createdBy.name} />
              <AvatarFallback>{createdBy.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{createdBy.name}</span>
          </div>
        );
      },
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
  questionSelectionModel?: string[];
  onQuestionSelectionModelChange?: (model: string[]) => void;
}

function SearchQuestionDataGridImpl({
  questionType,
  questionSelectionModel = [],
  onQuestionSelectionModelChange = () => {},
}: SearchQuestionDataGridProps) {
  'use no memo';

  const intl = useIntl();

  // Create repository instances with memoization to prevent unnecessary recreations
  const userRepo = useMemo(() => new UserRepository(), []);
  const { users, loading: usersLoading, error: usersError } = userRepo.useAllUsersOnce();

  // Memoize repository instance based on questionType to prevent re-fetching when other props change
  const questionRepo = useMemo(() => new BaseQuestionRepository(questionType as QuestionType), [questionType]);
  const { baseQuestions, baseQuestionsLoading, baseQuestionsError } = questionRepo.useQuestionsOnce(true);

  // Stabilize callback reference to prevent unnecessary child re-renders
  const memoizedOnSelectionChange = useCallback(
    (model: string[]) => onQuestionSelectionModelChange(model),
    [onQuestionSelectionModelChange]
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setGlobalFilter(searchInput), 500);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const rowSelection: RowSelectionState = useMemo(
    () => Object.fromEntries(questionSelectionModel.map((id) => [id, true])),
    [questionSelectionModel]
  );

  const rows = useMemo(
    () => (users && baseQuestions ? baseQuestions.map((question) => questionRow(question, users)) : []),
    [baseQuestions, users]
  );
  const columns = useMemo<ColumnDef<Features, Row>[]>(
    () => [selectColumn, ...questionColumns(questionType, intl)],
    [questionType, intl]
  );

  const table = useTable({
    features: tableFeaturesConfig,
    data: rows,
    columns,
    state: { sorting, pagination, rowSelection, globalFilter },
    getRowId: (row) => row.id as string,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      memoizedOnSelectionChange(Object.keys(next).filter((id) => next[id]));
    },
  });

  if (usersError || baseQuestionsError) {
    return <></>;
  }
  if (usersLoading || baseQuestionsLoading) {
    return <Spinner />;
  }
  if (!users || !baseQuestions) {
    return <></>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder={intl.formatMessage(messages.search)}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-sm"
      />

      <Table style={{ tableLayout: 'fixed', width: table.getTotalSize() }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{intl.formatMessage(messages.rowsPerPage)}</span>
          <Select value={pagination.pageSize} onValueChange={(value) => table.setPageSize(value as number)}>
            <SelectTrigger size="sm" className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {intl.formatMessage(messages.pageOf, { page: pagination.pageIndex + 1, total: table.getPageCount() || 1 })}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight />
          </Button>
        </div>
      </div>
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
