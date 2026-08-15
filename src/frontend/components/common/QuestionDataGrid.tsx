import { useEffect, useMemo, useState } from 'react';

import type { Column, ColumnDef } from '@tanstack/react-table';
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
import { useIntl, type IntlShape } from 'react-intl';

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import UserRepository from '@/backend/repositories/user/UserRepository';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { Button } from '@/frontend/components/ui/button';
import { Checkbox } from '@/frontend/components/ui/checkbox';
import { Input } from '@/frontend/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { Spinner } from '@/frontend/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/frontend/components/ui/table';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/question-type';

import { messages, questionRow, questionTypeToColumns, type ColSpec, type Row } from './questionDataGridMappers';

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
  const cols = questionTypeToColumns[questionType](intl);
  return [
    { accessorKey: 'id', header: sortableHeader(intl.formatMessage(messages.id)), size: 150 },
    { accessorKey: 'lang', header: sortableHeader(intl.formatMessage(globalMessages.language)), size: 100 },
    { accessorKey: 'topic', header: sortableHeader(intl.formatMessage(messages.topic)), size: 75 },
    ...toColumnDefs(cols),
    { accessorKey: 'createdAt', header: sortableHeader(intl.formatMessage(messages.createdAt)), size: 130 },
    {
      id: 'createdBy',
      accessorFn: (row) => (row.createdBy as { name: string }).name,
      header: sortableHeader(intl.formatMessage(messages.createdBy)),
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

interface SearchQuestionDataGridProps {
  questionType: QuestionType;
  onQuestionSelectionModelChange?: (model: string[]) => void;
}

// Renders a searchable, sortable, paginated table of existing questions with row-selection
// checkboxes. Sorting, pagination, and row selection are left fully uncontrolled (TanStack owns
// that state internally) since nothing outside this component reads or sets it directly; only the
// selected row ids are surfaced upward, one-way, via onQuestionSelectionModelChange. To clear the
// selection from outside, remount this component (e.g. via a changing `key`).
export function SearchQuestionDataGrid({
  questionType,
  onQuestionSelectionModelChange = () => {},
}: SearchQuestionDataGridProps) {
  'use no memo';

  const intl = useIntl();

  // Create repository instances with memoization to prevent unnecessary recreations
  const userRepo = useMemo(() => new UserRepository(), []);
  const { users, loading: usersLoading, error: usersError } = userRepo.useAllUsersOnce();

  // Memoize repository instance based on questionType to prevent re-fetching when other props change
  const questionRepo = useMemo(() => new BaseQuestionRepository(questionType), [questionType]);
  const { baseQuestions, baseQuestionsLoading, baseQuestionsError } = questionRepo.useQuestionsOnce(true);

  const [searchInput, setSearchInput] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setGlobalFilter(searchInput), 500);
    return () => clearTimeout(handle);
  }, [searchInput]);

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
    state: { globalFilter },
    getRowId: (row) => row.id as string,
    onGlobalFilterChange: setGlobalFilter,
  });

  const rowSelection = table.state.rowSelection;
  useEffect(() => {
    onQuestionSelectionModelChange(Object.keys(rowSelection).filter((id) => rowSelection[id]));
  }, [rowSelection, onQuestionSelectionModelChange]);

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
          <Select value={table.state.pagination.pageSize} onValueChange={(value) => table.setPageSize(value as number)}>
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
              page: table.state.pagination.pageIndex + 1,
              total: table.getPageCount() || 1,
            })}
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
