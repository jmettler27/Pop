'use client';

import React, { memo, useMemo, useState } from 'react';

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
import clsx from 'clsx';
import { ArrowUpDown, Check, ChevronDown, ChevronUp, GripVertical, Timer as TimerIcon, Trash2, X } from 'lucide-react';
import { useIntl } from 'react-intl';

import { removeRound, updateRound } from '@/frontend/api';
import { QuestionCardTitle } from '@/frontend/components/common/QuestionCard';
import { AddQuestionToRoundButton } from '@/frontend/components/game-editor/AddQuestionToRound';
import { EditQuestionCard } from '@/frontend/components/game-editor/EditQuestionInRound';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/frontend/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { type Locale } from '@/frontend/helpers/locales';
import { useEditableQuestion, useEditableQuestions } from '@/frontend/hooks/editableQuestion';
import { useRound } from '@/frontend/hooks/firestore/round/useRoundHooks';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameId from '@/frontend/hooks/useGameId';
import useHasMounted from '@/frontend/hooks/useHasMounted';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameStatus } from '@/models/games/game-status';
import { Round } from '@/models/rounds/round';
import { RoundType, roundTypeToEmoji, roundTypeToTitle } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { Timer } from '@/models/timer';
import { Topic, topicToEmoji } from '@/models/topic';

const messages = defineMessages('frontend.gameEditor.EditRoundInGame', {
  deleteDialogTitle: 'Are you sure you want to remove this round?',
  deleteDialogConfirm: 'Yes',
  defaultThinkingTime: 'Default thinking time for questions in this round',
  editThinkingTime: 'Thinking time (seconds)',
  defaultChallengeTime: 'Default challenge time for questions in this round',
  editChallengeTime: 'Challenge time (seconds)',
});

const editGameRoundCardNumCols = (roundType: RoundType | undefined) => {
  switch (roundType) {
    case RoundType.MATCHING:
    case RoundType.PROGRESSIVE_CLUES:
      return 'md:grid-cols-2';
    case RoundType.BASIC:
    case RoundType.ENUMERATION:
    case RoundType.ESTIMATION:
    case RoundType.LABELLING:
    case RoundType.MCQ:
    case RoundType.NAGUI:
    case RoundType.ODD_ONE_OUT:
    case RoundType.QUOTE:
    case RoundType.REORDERING:
      return 'md:grid-cols-3';
    default:
      return 'md:grid-cols-4';
  }
};

interface EditGameRoundCardProps {
  roundId: string;
  status: string;
  gameId: string;
  forceCollapse?: boolean;
}

// Helper to get thinkingTime/challengeTime off a round (only some round types have these)
type RoundWithTimes = { thinkingTime?: number; challengeTime?: number };

export const EditGameRoundCard = memo(function EditGameRoundCard({
  roundId,
  status,
  gameId,
  forceCollapse = false,
}: EditGameRoundCardProps) {
  const { round, loading, error } = useRound(gameId, roundId);
  const intl = useIntl();

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedQuestions, setReorderedQuestions] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(forceCollapse);
  const [prevForceCollapse, setPrevForceCollapse] = useState(forceCollapse);
  if (forceCollapse !== prevForceCollapse) {
    setPrevForceCollapse(forceCollapse);
    setIsCollapsed(forceCollapse);
  }

  const [thinkingTimePopoverOpen, setThinkingTimePopoverOpen] = useState(false);
  const [thinkingTimeEditValue, setThinkingTimeEditValue] = useState('');
  const [handleSaveThinkingTime, isSavingThinkingTime] = useAsyncAction(async (value: number) => {
    await updateRound(gameId, roundId, { action: 'thinking_time', thinkingTime: value });
    setThinkingTimePopoverOpen(false);
  });

  const handleThinkingTimeBadgeClick = () => {
    if (status !== GameStatus.GAME_EDIT) return;
    setThinkingTimeEditValue(String((round as unknown as RoundWithTimes)?.thinkingTime ?? ''));
    setThinkingTimePopoverOpen(true);
  };

  const [challengeTimePopoverOpen, setChallengeTimePopoverOpen] = useState(false);
  const [challengeTimeEditValue, setChallengeTimeEditValue] = useState('');
  const [handleSaveChallengeTime, isSavingChallengeTime] = useAsyncAction(async (value: number) => {
    await updateRound(gameId, roundId, { action: 'challenge_time', challengeTime: value });
    setChallengeTimePopoverOpen(false);
  });

  const handleChallengeTimeBadgeClick = () => {
    if (status !== GameStatus.GAME_EDIT) return;
    setChallengeTimeEditValue(String((round as unknown as RoundWithTimes)?.challengeTime ?? ''));
    setChallengeTimePopoverOpen(true);
  };

  if (error || loading || !round) {
    return <></>;
  }

  const roundWithTimes = round as unknown as RoundWithTimes;

  const handleToggleReorderMode = () => {
    if (!isReorderMode) {
      // Entering reorder mode - sync with current round questions and expand the card
      setReorderedQuestions([...round.questions]);
      setIsCollapsed(false);
    }
    setIsReorderMode(!isReorderMode);
  };

  const handleConfirmReorder = async () => {
    try {
      await updateRound(gameId, round.id!, { action: 'update', questions: reorderedQuestions });
      setIsReorderMode(false);
    } catch (error) {
      console.error('Failed to reorder questions:', error);
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 space-y-0 bg-linear-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-row items-center gap-5 min-w-0">
          <Tooltip>
            <TooltipTrigger render={<span className="text-xl shrink-0" />}>
              {roundTypeToEmoji(round.type as RoundType)}
            </TooltipTrigger>
            <TooltipContent>{roundTypeToTitle(round.type as RoundType, intl.locale as Locale)}</TooltipContent>
          </Tooltip>
          <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2 min-w-0">
            <i className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pr-1">
              {round.title}
            </i>
          </CardTitle>
          <div className="hidden sm:flex ml-2">
            <RoundTopicDistribution round={round} />
          </div>
          {roundWithTimes.thinkingTime != null && (
            <Popover open={thinkingTimePopoverOpen} onOpenChange={setThinkingTimePopoverOpen}>
              <Tooltip>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <TooltipTrigger
                      render={
                        <span
                          onClick={handleThinkingTimeBadgeClick}
                          className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shadow-xs ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                        />
                      }
                    />
                  }
                >
                  <TimerIcon className="size-3.5" />
                  {roundWithTimes.thinkingTime}s
                </PopoverTrigger>
                <TooltipContent>{intl.formatMessage(messages.defaultThinkingTime)}</TooltipContent>
              </Tooltip>
              <PopoverContent align="center" side="bottom" className="w-auto p-4 min-w-[240px]">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="round-thinking-time-input">{intl.formatMessage(messages.editThinkingTime)}</Label>
                    <Input
                      id="round-thinking-time-input"
                      type="number"
                      value={thinkingTimeEditValue}
                      onChange={(e) => setThinkingTimeEditValue(e.target.value)}
                      min={Timer.MIN_THINKING_TIME_SECONDS}
                      max={Timer.MAX_THINKING_TIME_SECONDS}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        const num = Number(thinkingTimeEditValue);
                        if (num >= Timer.MIN_THINKING_TIME_SECONDS && num <= Timer.MAX_THINKING_TIME_SECONDS)
                          handleSaveThinkingTime(num);
                      }}
                      disabled={
                        isSavingThinkingTime ||
                        !thinkingTimeEditValue ||
                        Number(thinkingTimeEditValue) < Timer.MIN_THINKING_TIME_SECONDS ||
                        Number(thinkingTimeEditValue) > Timer.MAX_THINKING_TIME_SECONDS
                      }
                    >
                      {intl.formatMessage(globalMessages.save)}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {roundWithTimes.challengeTime != null && (
            <Popover open={challengeTimePopoverOpen} onOpenChange={setChallengeTimePopoverOpen}>
              <Tooltip>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <TooltipTrigger
                      render={
                        <span
                          onClick={handleChallengeTimeBadgeClick}
                          className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 shadow-xs ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''}`}
                        />
                      }
                    />
                  }
                >
                  <TimerIcon className="size-3.5" />
                  {roundWithTimes.challengeTime}s ⚡
                </PopoverTrigger>
                <TooltipContent>{intl.formatMessage(messages.defaultChallengeTime)}</TooltipContent>
              </Tooltip>
              <PopoverContent align="center" side="bottom" className="w-auto p-4 min-w-[240px]">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="round-challenge-time-input">{intl.formatMessage(messages.editChallengeTime)}</Label>
                    <Input
                      id="round-challenge-time-input"
                      type="number"
                      value={challengeTimeEditValue}
                      onChange={(e) => setChallengeTimeEditValue(e.target.value)}
                      min={Timer.MIN_CHALLENGE_TIME_SECONDS}
                      max={Timer.MAX_CHALLENGE_TIME_SECONDS}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        const num = Number(challengeTimeEditValue);
                        if (num >= Timer.MIN_CHALLENGE_TIME_SECONDS && num <= Timer.MAX_CHALLENGE_TIME_SECONDS)
                          handleSaveChallengeTime(num);
                      }}
                      disabled={
                        isSavingChallengeTime ||
                        !challengeTimeEditValue ||
                        Number(challengeTimeEditValue) < Timer.MIN_CHALLENGE_TIME_SECONDS ||
                        Number(challengeTimeEditValue) > Timer.MAX_CHALLENGE_TIME_SECONDS
                      }
                    >
                      {intl.formatMessage(globalMessages.save)}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-blue-500 hover:bg-blue-500/10 hover:scale-110 transition-transform"
                />
              }
            >
              {isCollapsed ? <ChevronDown /> : <ChevronUp />}
            </TooltipTrigger>
            <TooltipContent>{isCollapsed ? 'Expand' : 'Collapse'}</TooltipContent>
          </Tooltip>
          {status === GameStatus.GAME_EDIT && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleReorderMode}
                      className={clsx(
                        'hover:scale-110 transition-transform',
                        isReorderMode ? 'text-amber-500 hover:bg-amber-500/10' : 'text-blue-500 hover:bg-blue-500/10'
                      )}
                    />
                  }
                >
                  {isReorderMode ? <X /> : <ArrowUpDown />}
                </TooltipTrigger>
                <TooltipContent>{isReorderMode ? 'Stop reordering' : 'Reorder questions'}</TooltipContent>
              </Tooltip>
              {isReorderMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleConfirmReorder}
                  className="text-green-500 hover:bg-green-500/10 hover:scale-110 transition-transform"
                >
                  <Check />
                </Button>
              )}
              {!isReorderMode && <RemoveRoundFromGameButton roundId={round.id} />}
            </>
          )}
        </div>
      </CardHeader>
      <div className="sm:hidden px-4 pt-2 flex items-center gap-2">
        <RoundTopicDistribution round={round} />
        {roundWithTimes.thinkingTime != null && (
          <span
            onClick={handleThinkingTimeBadgeClick}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shadow-xs ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
          >
            <TimerIcon className="size-3.5" />
            {roundWithTimes.thinkingTime}s
          </span>
        )}
        {roundWithTimes.challengeTime != null && (
          <span
            onClick={handleChallengeTimeBadgeClick}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 shadow-xs ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''}`}
          >
            <TimerIcon className="size-3.5" />
            {roundWithTimes.challengeTime}s ⚡
          </span>
        )}
      </div>
      {!isCollapsed && (
        <CardContent className="p-6 bg-linear-to-br from-slate-50/50 to-transparent dark:from-slate-900/50">
          <EditGameRoundQuestionCards
            round={round}
            status={status}
            isReorderMode={isReorderMode}
            reorderedQuestions={reorderedQuestions}
            setReorderedQuestions={setReorderedQuestions}
          />
          {status === GameStatus.GAME_EDIT && !isReorderMode && (
            <AddQuestionToRoundButton round={round} disabled={round.questions.length >= Round.MAX_NUM_QUESTIONS} />
          )}
        </CardContent>
      )}
    </Card>
  );
});

interface SortableQuestionCardProps {
  roundId: string;
  questionId: string;
  questionOrder: number;
  status: string;
  siblingQuestionIds: string[];
}

function SortableQuestionCard({
  roundId,
  questionId,
  questionOrder,
  status,
  siblingQuestionIds,
}: SortableQuestionCardProps) {
  const gameId = useGameId();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: questionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useEditableQuestion(
    gameId as string,
    questionId,
    siblingQuestionIds
  );

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) {
    return <></>;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className="border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3 py-3 px-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-1 transition-colors"
          >
            <GripVertical className="text-slate-400 dark:text-slate-500" />
          </div>
          <CardTitle className="text-base md:text-lg dark:text-white grow font-medium">
            <span className="mr-2 font-bold text-blue-600 dark:text-blue-400">#{questionOrder + 1}</span>
            <QuestionCardTitle baseQuestion={baseQuestion} showType={true} />
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

interface RoundTopicDistributionProps {
  round: AnyRound;
}

function RoundTopicDistribution({ round }: RoundTopicDistributionProps) {
  const gameId = useGameId();
  const { questions: ids } = round;
  const hasMounted = useHasMounted();

  // Rides the same batch request as the question cards below.
  const { questionsById } = useEditableQuestions(gameId as string, ids);

  const topics = useMemo(() => {
    const distribution = ids.reduce<Record<string, number>>((acc, id) => {
      const topic = (questionsById[id] as { topic?: string } | undefined)?.topic ?? '';
      acc[topic] = (acc[topic] ?? 0) + 1;
      return acc;
    }, {});
    return Object.keys(distribution)
      .sort()
      .reduce<Record<string, number>>((acc, key) => {
        acc[key] = distribution[key];
        return acc;
      }, {});
  }, [ids, questionsById]);

  const totalQuestions = ids.length;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" suppressHydrationWarning>
      {/* Total questions badge */}
      <span className="inline-flex items-center px-3 py-1.5 rounded-full font-semibold bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
      </span>

      {/* Topic distribution badges */}
      {hasMounted && Object.entries(topics).length > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600 text-lg">•</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(topics).map(([topic, count]) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-lg">{topicToEmoji(topic as Topic)}</span>
                <span className="text-xs font-bold">{count}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface EditGameRoundQuestionCardsProps {
  round: AnyRound;
  status: string;
  isReorderMode: boolean;
  reorderedQuestions: string[];
  setReorderedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
}

function EditGameRoundQuestionCards({
  round,
  status,
  isReorderMode,
  reorderedQuestions,
  setReorderedQuestions,
}: EditGameRoundQuestionCardsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id !== over.id) {
      setReorderedQuestions((items) => {
        const oldIndex = items.indexOf(String(active.id));
        const newIndex = items.indexOf(String(over.id));

        const newOrder = arrayMove(items, oldIndex, newIndex);
        return newOrder;
      });
    }
  };

  const questionIds = isReorderMode ? reorderedQuestions : round.questions;

  const roundWithTimes = round as unknown as RoundWithTimes;

  if (isReorderMode) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {questionIds.map((questionId, idx) => (
              <SortableQuestionCard
                key={questionId}
                roundId={round.id ?? ''}
                questionId={questionId}
                questionOrder={idx}
                status={status}
                siblingQuestionIds={questionIds}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className={clsx('grid', 'gap-4', 'items-start', editGameRoundCardNumCols(round.type as RoundType))}>
      {questionIds.map((questionId, idx) => (
        <EditQuestionCard
          key={questionId}
          roundId={round.id ?? ''}
          questionId={questionId}
          questionOrder={idx}
          status={status}
          siblingQuestionIds={questionIds}
          roundThinkingTime={roundWithTimes.thinkingTime}
          roundChallengeTime={roundWithTimes.challengeTime}
        />
      ))}
    </div>
  );
}

interface RemoveRoundFromGameButtonProps {
  roundId: string | undefined;
}

function RemoveRoundFromGameButton({ roundId }: RemoveRoundFromGameButtonProps) {
  const intl = useIntl();
  const gameId = useGameId();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [handleRemoveRound, isRemoving] = useAsyncAction(async () => {
    await removeRound(gameId as string, roundId as string);
  });

  const onCancel = () => {
    setDialogOpen(false);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setDialogOpen(true)}
              disabled={isRemoving}
            />
          }
        >
          <Trash2 />
        </TooltipTrigger>
        <TooltipContent>Delete round</TooltipContent>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open, eventDetails) => {
          if (eventDetails.reason === 'escape-key') return;
          if (!open) onDialogClose();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{intl.formatMessage(messages.deleteDialogTitle)}</DialogTitle>
            <DialogDescription>{intl.formatMessage(globalMessages.dialogWarning)}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={handleRemoveRound} disabled={isRemoving}>
              {intl.formatMessage(messages.deleteDialogConfirm)}
            </Button>

            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={onCancel}
            >
              {intl.formatMessage(globalMessages.cancel)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
