'use client';

import { useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemButton,
  Typography,
} from '@mui/material';
import { clsx } from 'clsx';
import { useIntl } from 'react-intl';

import { submitOrdering } from '@/backend/services/question/reordering/actions';
import {
  messages,
  ReorderingEndView,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameStatus } from '@/models/games/game-status';
import { GameReorderingQuestion, ReorderingItem, ReorderingQuestion } from '@/models/questions/reordering';

interface ReorderingPlayerPaneProps {
  baseQuestion: ReorderingQuestion;
  gameQuestion: GameReorderingQuestion;
  randomMapping: number[];
}

export default function ReorderingPlayerPane({ baseQuestion, gameQuestion, randomMapping }: ReorderingPlayerPaneProps) {
  const game = useGame();

  if (!game) return null;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <ReorderingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center overflow-hidden">
        {game.status === GameStatus.QUESTION_ACTIVE && (
          <ReorderingPlayerActiveView
            baseQuestion={baseQuestion}
            gameQuestion={gameQuestion}
            randomMapping={randomMapping}
          />
        )}
        {game.status === GameStatus.QUESTION_END && (
          <ReorderingEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

interface ReorderingPlayerActiveViewProps {
  baseQuestion: ReorderingQuestion;
  gameQuestion: GameReorderingQuestion;
  randomMapping: number[];
}

function ReorderingPlayerActiveView({ baseQuestion, gameQuestion, randomMapping }: ReorderingPlayerActiveViewProps) {
  const intl = useIntl();
  const game = useGame();
  const user = useUser();
  const myTeam = useTeam();
  const [orderedIndices, setOrderedIndices] = useState<number[]>(randomMapping);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [handleSubmitOrdering, isSubmitting] = useAsyncAction(async () => {
    if (!game || !user) return;
    await submitOrdering(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id as string,
      myTeam as string,
      orderedIndices
    );
    setDialogOpen(false);
  });

  if (!game) return null;
  if (!user) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedIndices.indexOf(Number(active.id));
      const newIndex = orderedIndices.indexOf(Number(over.id));
      setOrderedIndices(arrayMove(orderedIndices, oldIndex, newIndex));
    }
  };

  const orderings = gameQuestion.orderings ?? [];
  // Check if this team has already submitted
  const teamOrdering = myTeam ? orderings.find((o) => o.teamId === myTeam) : undefined;
  const teamSubmitted = !!teamOrdering;
  const teamSubmission = teamOrdering?.ordering;
  const submittedByMe = false; // playerId not available from orderings map

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const items = baseQuestion.items ?? [];

  if (teamSubmitted && teamSubmission) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-4 space-y-4">
        <List className="rounded-lg w-1/2 max-h-[60vh] overflow-y-auto mb-3 bg-white dark:bg-slate-900">
          {teamSubmission.map((idx: number, displayOrder: number) => (
            <ListItemButton key={idx} divider={displayOrder !== teamSubmission.length - 1} disabled>
              <Typography variant="h6" className="flex items-center">
                <span className="mr-4 font-bold text-lg">{displayOrder + 1}.</span>
                {items[idx]?.title}
              </Typography>
            </ListItemButton>
          ))}
        </List>

        <div className="flex flex-col items-center justify-center space-y-2">
          <CheckCircleIcon sx={{ fontSize: 50, color: 'success.main' }} />
        </div>
        <span className="text-xl font-semibold text-green-600">
          {submittedByMe ? intl.formatMessage(messages.youSubmitted) : intl.formatMessage(messages.teammateSubmitted)}
        </span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center py-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      >
        <SortableContext items={orderedIndices} strategy={verticalListSortingStrategy}>
          <List className="rounded-2xl w-[55vw] max-h-[60vh] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70">
            {orderedIndices.map((idx: number, displayOrder: number) => (
              <ReorderingItemDraggable
                key={idx}
                itemIdx={idx}
                displayOrder={displayOrder}
                item={items[idx]}
                isLast={displayOrder === orderedIndices.length - 1}
                disabled={teamSubmitted}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>

      <Button
        variant="contained"
        color="success"
        size="large"
        className="shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mt-3"
        onClick={handleOpenDialog}
        disabled={isSubmitting || teamSubmitted}
      >
        {intl.formatMessage(messages.submitOrdering)}
      </Button>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{intl.formatMessage(messages.confirmDialogTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText>{intl.formatMessage(messages.confirmDialogMessage)}</DialogContentText>
          <ol className="mt-4 ml-4 list-decimal">
            {orderedIndices.map((idx: number, position: number) => (
              <li key={position} className="text-md">
                {items[idx]?.title}
              </li>
            ))}
          </ol>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="success" onClick={handleSubmitOrdering} disabled={isSubmitting}>
            {intl.formatMessage(globalMessages.submit)}
          </Button>

          <Button variant="outlined" color="error" onClick={handleCloseDialog} disabled={isSubmitting}>
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

interface ReorderingItemDraggableProps {
  itemIdx: number;
  displayOrder: number;
  item: ReorderingItem;
  isLast: boolean;
  disabled: boolean;
}

function ReorderingItemDraggable({ itemIdx, displayOrder, item, isLast, disabled }: ReorderingItemDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemIdx,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div className="flex items-center mb-2">
      <div className="w-10 pr-2 text-right font-bold text-lg text-slate-400 dark:text-slate-500">
        {displayOrder + 1}.
      </div>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={clsx('flex-1', {
          'opacity-50 cursor-grab': !disabled,
          'cursor-not-allowed opacity-75': disabled,
        })}
      >
        <ListItemButton
          divider={false}
          disabled={disabled}
          className="rounded-xl"
          sx={{
            bgcolor: '#0f172a',
            borderRadius: 3,
            border: '1px solid',
            borderColor: '#1f2937',
            boxShadow: '0 6px 16px rgba(2, 6, 23, 0.35)',
            py: 1.25,
            '&.Mui-disabled': {
              opacity: 1.0,
            },
            '&:hover': {
              boxShadow: '0 10px 22px rgba(2, 6, 23, 0.5)',
              borderColor: '#334155',
            },
          }}
        >
          <div className="flex items-center w-full">
            <DragIndicatorIcon className="text-slate-500 mr-3" fontSize="small" />
            <Typography variant="h6" className="flex items-center text-slate-100">
              {item?.title}
            </Typography>
          </div>
        </ListItemButton>
      </div>
    </div>
  );
}
