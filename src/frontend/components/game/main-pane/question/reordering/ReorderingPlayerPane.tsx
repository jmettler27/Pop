'use client';

import { useMemo, useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
  ReorderingItemAccordion,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import type { GameRounds } from '@/models/games/game';
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

  const myTeam = useTeam();

  // Get team's submission
  const orderings = gameQuestion?.orderings ?? {};
  const teamSubmission = myTeam ? orderings[myTeam] : undefined;
  const teamSubmitted = !!teamSubmission;

  // Build placement map for score comparison
  const teamPlacementMap = useMemo(() => {
    if (!teamSubmission) return {} as Record<number, number>;
    const map: Record<number, number> = {};
    (teamSubmission as number[]).forEach((itemIdx: number, positionPlaced: number) => {
      map[itemIdx] = positionPlaced;
    });
    return map;
  }, [teamSubmission]);

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <ReorderingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {game.status === GameStatus.QUESTION_ACTIVE && (
          <ReorderingPlayerActiveView
            baseQuestion={baseQuestion}
            gameQuestion={gameQuestion}
            randomMapping={randomMapping}
          />
        )}
        {game.status === GameStatus.QUESTION_END && (
          <ReorderingPlayerEndView
            baseQuestion={baseQuestion}
            teamSubmission={teamSubmission as number[] | undefined}
            teamSubmitted={teamSubmitted}
            teamPlacementMap={teamPlacementMap}
          />
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
  if (!game) return null;

  const user = useUser();
  if (!user) return null;

  const myTeam = useTeam();
  const [orderedIndices, setOrderedIndices] = useState<number[]>(randomMapping);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedIndices.indexOf(Number(active.id));
      const newIndex = orderedIndices.indexOf(Number(over.id));
      setOrderedIndices(arrayMove(orderedIndices, oldIndex, newIndex));
    }
  };

  const orderings = gameQuestion.orderings ?? {};
  // Check if this team has already submitted
  const teamSubmitted = myTeam ? !!orderings[myTeam] : false;
  const teamSubmission = myTeam ? (orderings[myTeam] as number[] | undefined) : undefined;
  const submittedByMe = false; // playerId not available from orderings map

  const [handleSubmitOrdering, isSubmitting] = useAsyncAction(async () => {
    await submitOrdering(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id,
      myTeam as string,
      orderedIndices.map(String)
    );
    setDialogOpen(false);
  });

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const items = baseQuestion.items ?? [];

  if (teamSubmitted && teamSubmission) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4 space-y-4">
        <List className="rounded-lg max-h-[80%] w-1/2 overflow-y-auto mb-3 bg-white dark:bg-slate-900">
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
    <div className="w-full flex flex-col items-center justify-center p-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIndices} strategy={verticalListSortingStrategy}>
          <List className="rounded-2xl max-h-[90%] w-[55%] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70">
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
        className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mt-3"
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

interface ReorderingPlayerEndViewProps {
  baseQuestion: ReorderingQuestion;
  teamSubmission: number[] | undefined;
  teamSubmitted: boolean;
  teamPlacementMap: Record<number, number>;
}

function ReorderingPlayerEndView({
  baseQuestion,
  teamSubmission,
  teamSubmitted,
  teamPlacementMap,
}: ReorderingPlayerEndViewProps) {
  const intl = useIntl();
  const [expandedIdx, setExpandedIdx] = useState<number | false>(false);
  const items = baseQuestion.items ?? [];
  const displayOrder = items.map((_: unknown, i: number) => i);

  const handleAccordionChange = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? false : idx);
  };

  return (
    <div className="flex flex-col items-center w-1/2 max-h-[90%]">
      <List className="rounded-lg w-full overflow-y-auto mb-3 bg-white dark:bg-slate-900">
        {displayOrder.map((idx: number, position: number) => (
          <ReorderingItemAccordion
            key={idx}
            item={items[idx]}
            displayOrder={position}
            expanded={expandedIdx === idx}
            onAccordionChange={() => handleAccordionChange(idx)}
            teamSubmitted={teamSubmitted}
            teamPlacedAt={teamPlacementMap[idx]}
            isCorrect={teamPlacementMap[idx] === position}
          />
        ))}
      </List>

      {teamSubmitted && teamSubmission && (
        <div className="flex items-center justify-center mt-2 mb-3">
          <Typography
            variant="h5"
            className="font-bold"
            sx={{
              color:
                teamSubmission.length === items.length
                  ? 'success.main'
                  : teamSubmission.length >= items.length / 2
                    ? 'warning.main'
                    : 'error.main',
            }}
          >
            {intl.formatMessage(messages.yourScore, {
              score: teamSubmission.length,
              maxScore: items.length,
            })}
          </Typography>
        </div>
      )}
    </div>
  );
}
