'use client';

import { useState } from 'react';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { clsx } from 'clsx';
import { CheckCircle2, GripVertical } from 'lucide-react';
import { useIntl } from 'react-intl';

import { submitOrdering } from '@/backend/services/question/reordering/actions';
import {
  messages,
  ReorderingEndView,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useIsMobile from '@/frontend/hooks/useIsMobile';
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
  const isMobile = useIsMobile();

  if (!game) return null;

  return (
    <div className="flex flex-col h-full items-center">
      {!isMobile && (
        <div className="h-[15%] w-full flex flex-col items-center justify-center">
          <ReorderingQuestionHeader baseQuestion={baseQuestion} />
        </div>
      )}
      <div
        className={clsx(
          'w-full flex flex-col items-center justify-center overflow-hidden',
          isMobile ? 'h-full' : 'h-[85%]'
        )}
      >
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
  const isMobile = useIsMobile();
  const [orderedIndices, setOrderedIndices] = useState<number[]>(randomMapping);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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
        <div
          className={clsx(
            'rounded-lg max-h-[60vh] overflow-y-auto mb-3 bg-white dark:bg-slate-900',
            isMobile ? 'w-[90vw]' : 'w-1/2'
          )}
        >
          {teamSubmission.map((idx: number, displayOrder: number) => (
            <div
              key={idx}
              className={clsx('px-4 py-2', displayOrder !== teamSubmission.length - 1 && 'border-b border-border')}
            >
              <h6 className="text-xl flex items-center">
                <span className="mr-4 font-bold text-lg">{displayOrder + 1}.</span>
                {items[idx]?.title}
              </h6>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center space-y-2">
          <CheckCircle2 className="size-[50px] text-green-500" />
        </div>
        <span className="text-xl font-semibold text-green-600">
          {submittedByMe ? intl.formatMessage(messages.youSubmitted) : intl.formatMessage(messages.teammateSubmitted)}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx('h-full w-full flex flex-col items-center py-4', isMobile ? 'gap-3' : 'justify-center')}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      >
        <SortableContext items={orderedIndices} strategy={verticalListSortingStrategy}>
          <div
            className={clsx(
              'rounded-2xl w-[92vw] md:w-[55vw] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70',
              isMobile ? 'max-h-[75dvh]' : 'max-h-[60vh]'
            )}
          >
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
          </div>
        </SortableContext>
      </DndContext>

      <Button
        size="lg"
        className={clsx(
          'bg-green-600 text-white hover:bg-green-600/80',
          'shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mt-3'
        )}
        onClick={handleOpenDialog}
        disabled={isSubmitting || teamSubmitted}
      >
        {intl.formatMessage(messages.submitOrdering)}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{intl.formatMessage(messages.confirmDialogTitle)}</DialogTitle>
            <DialogDescription>{intl.formatMessage(messages.confirmDialogMessage)}</DialogDescription>
          </DialogHeader>
          <ol className="mt-4 ml-4 list-decimal">
            {orderedIndices.map((idx: number, position: number) => (
              <li key={position} className="text-md">
                {items[idx]?.title}
              </li>
            ))}
          </ol>

          <DialogFooter>
            <Button
              className="bg-green-600 text-white hover:bg-green-600/80"
              onClick={handleSubmitOrdering}
              disabled={isSubmitting}
            >
              {intl.formatMessage(globalMessages.submit)}
            </Button>

            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              {intl.formatMessage(globalMessages.cancel)}
            </Button>
          </DialogFooter>
        </DialogContent>
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

function ReorderingItemDraggable({ itemIdx, displayOrder, item, disabled }: ReorderingItemDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemIdx,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div className="flex items-center mb-2">
      <div className="w-7 md:w-10 pr-2 text-right font-bold text-sm md:text-xl text-slate-400 dark:text-slate-500">
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
        <div className="rounded-xl bg-[#0f172a] border border-[#1f2937] shadow-[0_6px_16px_rgba(2,6,23,0.35)] py-1.5 md:py-2.5 hover:shadow-[0_10px_22px_rgba(2,6,23,0.5)] hover:border-[#334155] transition-shadow">
          <div className="flex items-center w-full">
            <GripVertical className="text-slate-500 mr-2 size-4" />
            <p className="flex items-center text-slate-100 text-[0.9rem] md:text-[1.25rem] leading-[1.3]">
              {item?.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
