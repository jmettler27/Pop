import { useEffect, useMemo, useState } from 'react';

import type { ColumnDef } from '@tanstack/react-table';
import {
  columnSizingFeature,
  columnVisibilityFeature,
  flexRender,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIntl, type IntlShape } from 'react-intl';

import {
  messages,
  questionRow,
  questionTypeToColumns,
  type ColSpec,
  type Row,
} from '@/frontend/components/common/questionSearchTableMappers';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { Button } from '@/frontend/components/ui/button';
import { Checkbox } from '@/frontend/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { Spinner } from '@/frontend/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/frontend/components/ui/table';
import { useApprovedQuestionsCount, useApprovedQuestionsPage } from '@/frontend/hooks/questionBank';
import { useUsersByIds } from '@/frontend/hooks/useUsersByIds';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/question-type';

const tableFeaturesConfig = tableFeatures({
  columnSizingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
});

type Features = typeof tableFeaturesConfig;

const toColumnDefs = (specs: ColSpec[]): ColumnDef<Features, Row>[] =>
  specs.map((spec) => ({
    accessorKey: spec.field,
    header: spec.headerName,
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
  const cols = questionTypeToColumns[questionType](intl);
  return [
    { accessorKey: 'lang', header: intl.formatMessage(globalMessages.language), size: 100 },
    { accessorKey: 'topic', header: intl.formatMessage(messages.topic), size: 75 },
    ...toColumnDefs(cols),
    { accessorKey: 'createdAt', header: intl.formatMessage(messages.createdAt), size: 130 },
    {
      id: 'createdBy',
      accessorFn: (row) => (row.createdBy as { name: string }).name,
      header: intl.formatMessage(messages.createdBy),
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

interface QuestionSearchTableProps {
  questionType: QuestionType;
  onQuestionSelectionModelChange?: (model: string[]) => void;
}

// Renders a paginated table of existing questions (newest first), one offset page at a time via the
// `useApprovedQuestionsPage` server action, with row-selection checkboxes. `pageIndex` is the only
// pagination state kept here; TanStack Query caches each page (and keeps the previous one visible while
// the next loads). Row selection is left fully uncontrolled (TanStack owns that state internally) and is
// keyed by row id, so it survives navigating between pages — only the selected row ids are surfaced
// upward, one-way, via onQuestionSelectionModelChange. To clear the selection from outside, remount this
// component (e.g. via a changing `key`).
export function QuestionSearchTable({
  questionType,
  onQuestionSelectionModelChange = () => {},
}: QuestionSearchTableProps) {
  'use no memo';

  const intl = useIntl();

  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // The question bank and its count come from server actions — production Firestore rules deny the client
  // querying the `questions` collection (only `get` on a known id is allowed).
  const {
    items: questions,
    hasMore,
    loading: questionsLoading,
    error: questionsError,
  } = useApprovedQuestionsPage(questionType, pageSize, pageIndex);
  const questionsCount = useApprovedQuestionsCount(questionType);
  const pageCount = questionsCount !== undefined ? Math.max(1, Math.ceil(questionsCount / pageSize)) : undefined;

  // Author display fields come from a server action — production Firestore rules deny client reads of `users/**`.
  const {
    users,
    loading: usersLoading,
    error: usersError,
  } = useUsersByIds(questions.map((question) => question.createdBy));

  const goToPreviousPage = () => setPageIndex((i) => Math.max(0, i - 1));
  const goToNextPage = () => {
    if (hasMore) setPageIndex((i) => i + 1);
  };
  const changePageSize = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const rows = useMemo(
    () => questions.map((question) => questionRow(question, intl.locale, users)),
    [questions, intl.locale, users]
  );
  const columns = useMemo<ColumnDef<Features, Row>[]>(
    () => [selectColumn, ...questionColumns(questionType, intl)],
    [questionType, intl]
  );

  const table = useTable({
    features: tableFeaturesConfig,
    data: rows,
    columns,
    getRowId: (row) => row.id as string,
  });

  const rowSelection = table.state.rowSelection;
  useEffect(() => {
    onQuestionSelectionModelChange(Object.keys(rowSelection).filter((id) => rowSelection[id]));
  }, [rowSelection, onQuestionSelectionModelChange]);

  if (usersError || questionsError) {
    return <></>;
  }
  if (usersLoading || questionsLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-2">
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
          <Select value={pageSize} onValueChange={(value) => changePageSize(value as number)}>
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
            {intl.formatMessage(messages.pageOf, {
              page: pageIndex + 1,
              total: pageCount ?? '…',
            })}
          </span>
          <Button variant="outline" size="icon-sm" onClick={goToPreviousPage} disabled={pageIndex === 0}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goToNextPage} disabled={!hasMore}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
