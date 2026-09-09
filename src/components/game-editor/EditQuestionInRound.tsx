import React, { memo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Pencil, Timer as TimerIcon, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import { removeRoundQuestion, ROUND_QUESTION_ACTIONS, updateRoundQuestion } from '@/api';
import { QuestionCardContent, QuestionCardTitle } from '@/components/common/QuestionCard';
import SubmitBasicQuestionForm from '@/components/question-forms/SubmitBasicQuestionForm';
import SubmitBlindtestQuestionForm from '@/components/question-forms/SubmitBlindtestQuestionForm';
import SubmitEmojiQuestionForm from '@/components/question-forms/SubmitEmojiQuestionForm';
import SubmitEnumerationQuestionForm from '@/components/question-forms/SubmitEnumerationQuestionForm';
import SubmitEstimationQuestionForm from '@/components/question-forms/SubmitEstimationQuestionForm';
import SubmitImageQuestionForm from '@/components/question-forms/SubmitImageQuestionForm';
import SubmitLabellingQuestionForm from '@/components/question-forms/SubmitLabellingQuestionForm';
import SubmitMatchingQuestionForm from '@/components/question-forms/SubmitMatchingQuestionForm';
import SubmitMCQForm from '@/components/question-forms/SubmitMCQQuestionForm';
import SubmitNaguiQuestionForm from '@/components/question-forms/SubmitNaguiQuestionForm';
import SubmitOddOneOutQuestionForm from '@/components/question-forms/SubmitOddOneOutQuestionForm';
import SubmitProgressiveCluesQuestionForm from '@/components/question-forms/SubmitProgressiveCluesQuestionForm';
import SubmitQuoteQuestionForm from '@/components/question-forms/SubmitQuoteQuestionForm';
import SubmitReorderingQuestionForm from '@/components/question-forms/SubmitReorderingQuestionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditableQuestion } from '@/hooks/editableQuestion';
import { useQuestion as useGameQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import useUserId from '@/hooks/useUserId';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { GameStatus } from '@/models/games/game-status';
import { QuestionType } from '@/models/questions/question-type';
import { AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import { Timer } from '@/models/timer';

const messages = defineMessages('frontend.gameEditor.EditQuestionInRound', {
  deleteDialogTitle: 'Are you sure you want to remove this question?',
  deleteDialogConfirm: 'Yes',
  thinkingTimeOverridden: 'Overridden thinking time',
  thinkingTimeInherited: 'Inherited from round',
  editThinkingTime: 'Thinking time (seconds)',
  resetToRound: 'Reset to round default',
  challengeTimeOverridden: 'Overridden challenge time',
  challengeTimeInherited: 'Challenge time (inherited from round)',
  editChallengeTime: 'Challenge time (seconds)',
  editQuestion: 'Edit question',
  editQuestionDialogTitle: 'Edit question',
});

interface EditQuestionCardProps {
  roundId: string;
  questionId: string;
  questionOrder: number;
  status: string;
  siblingQuestionIds: string[];
  roundThinkingTime?: number | null;
  roundChallengeTime?: number | null;
}

export const EditQuestionCard = memo(function EditQuestionCard({
  roundId,
  questionId,
  questionOrder: _questionOrder,
  status,
  siblingQuestionIds,
  roundThinkingTime,
  roundChallengeTime,
}: EditQuestionCardProps) {
  const gameId = useGameId();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useEditableQuestion(
    gameId,
    questionId,
    siblingQuestionIds
  );

  if (baseQuestionError) {
    return <></>;
  }
  if (baseQuestionLoading) {
    return <QuestionCardSkeleton />;
  }
  if (!baseQuestion) {
    return <></>;
  }

  return (
    <EditQuestionCardInner
      baseQuestion={baseQuestion}
      gameId={gameId as string}
      roundId={roundId}
      questionId={questionId}
      status={status}
      roundThinkingTime={roundThinkingTime}
      roundChallengeTime={roundChallengeTime}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    />
  );
});

interface EditQuestionCardInnerProps {
  baseQuestion: AnyBaseQuestion;
  gameId: string;
  roundId: string;
  questionId: string;
  status: string;
  roundThinkingTime?: number | null;
  roundChallengeTime?: number | null;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

function EditQuestionCardInner({
  baseQuestion,
  gameId,
  roundId,
  questionId,
  status,
  roundThinkingTime,
  roundChallengeTime,
  isCollapsed,
  setIsCollapsed,
}: EditQuestionCardInnerProps) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const userId = useUserId();
  const canEdit = userId && baseQuestion.createdBy === userId;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    // The edit went through a `Submit*QuestionForm`; refresh the editor's cached copies.
    queryClient.invalidateQueries({ queryKey: ['editableQuestions', gameId] });
  };

  const { gameQuestion } = useGameQuestion(gameId, roundId, baseQuestion.type, questionId);

  const gameQuestionAny = gameQuestion as { thinkingTime?: number; challengeTime?: number } | null;
  const questionThinkingTime = gameQuestionAny?.thinkingTime;
  const isOverridden =
    questionThinkingTime != null && roundThinkingTime != null && questionThinkingTime !== roundThinkingTime;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [handleSaveThinkingTime, isSaving] = useAsyncAction(async (value: number) => {
    await updateRoundQuestion(gameId, roundId, questionId, {
      action: ROUND_QUESTION_ACTIONS.SetThinkingTime,
      seconds: value,
    });
    setPopoverOpen(false);
  });

  const handleBadgeClick = () => {
    if (status !== GameStatus.GAME_EDIT) return;
    setEditValue(String(questionThinkingTime ?? roundThinkingTime ?? ''));
    setPopoverOpen(true);
  };

  const handleResetToRound = () => {
    if (roundThinkingTime != null) {
      handleSaveThinkingTime(roundThinkingTime);
    }
  };

  const questionChallengeTime = gameQuestionAny?.challengeTime;
  const displayedChallengeTime = questionChallengeTime ?? roundChallengeTime;
  const isChallengeOverridden =
    questionChallengeTime != null && roundChallengeTime != null && questionChallengeTime !== roundChallengeTime;

  const [challengePopoverOpen, setChallengePopoverOpen] = useState(false);
  const [editValueChallenge, setEditValueChallenge] = useState('');
  const [handleSaveChallengeTime, isSavingChallenge] = useAsyncAction(async (value: number) => {
    await updateRoundQuestion(gameId, roundId, questionId, {
      action: ROUND_QUESTION_ACTIONS.SetChallengeTime,
      seconds: value,
    });
    setChallengePopoverOpen(false);
  });

  const handleChallengeBadgeClick = () => {
    if (status !== GameStatus.GAME_EDIT) return;
    setEditValueChallenge(String(displayedChallengeTime ?? ''));
    setChallengePopoverOpen(true);
  };

  const handleResetChallengeToRound = () => {
    if (roundChallengeTime != null) {
      handleSaveChallengeTime(roundChallengeTime);
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-xl overflow-hidden group hover:scale-[1.02]">
      <CardHeader
        className={`flex flex-row items-center justify-between bg-linear-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-900 py-2 px-3 ${!isCollapsed ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
      >
        {/* <span className='text-base md:text-lg dark:text-white'>#{questionOrder + 1}</span> */}
        <CardTitle className="text-sm md:text-base dark:text-white font-semibold">
          <QuestionCardTitle baseQuestion={baseQuestion} showType={true} />
        </CardTitle>
        <div className="flex gap-1 items-center">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            {questionThinkingTime != null && (
              <Tooltip>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <TooltipTrigger
                      render={
                        <span
                          onClick={handleBadgeClick}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''} ${
                            isOverridden
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        />
                      }
                    />
                  }
                >
                  <TimerIcon className="size-3" />
                  {questionThinkingTime}s
                </PopoverTrigger>
                <TooltipContent>
                  {intl.formatMessage(isOverridden ? messages.thinkingTimeOverridden : messages.thinkingTimeInherited)}
                </TooltipContent>
              </Tooltip>
            )}
            <PopoverContent align="center" side="bottom" className="w-auto p-4 min-w-[240px]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="thinking-time-input">{intl.formatMessage(messages.editThinkingTime)}</Label>
                  <Input
                    id="thinking-time-input"
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    min={Timer.MIN_THINKING_TIME_SECONDS}
                    max={Timer.MAX_THINKING_TIME_SECONDS}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {isOverridden && roundThinkingTime != null && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleResetToRound}
                      disabled={isSaving}
                      className="text-amber-500 hover:bg-amber-500/10"
                    >
                      {intl.formatMessage(messages.resetToRound)}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      const num = Number(editValue);
                      if (num >= Timer.MIN_THINKING_TIME_SECONDS && num <= Timer.MAX_THINKING_TIME_SECONDS)
                        handleSaveThinkingTime(num);
                    }}
                    disabled={
                      isSaving ||
                      !editValue ||
                      Number(editValue) < Timer.MIN_THINKING_TIME_SECONDS ||
                      Number(editValue) > Timer.MAX_THINKING_TIME_SECONDS
                    }
                  >
                    {intl.formatMessage(globalMessages.save)}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={challengePopoverOpen} onOpenChange={setChallengePopoverOpen}>
            {displayedChallengeTime != null && (
              <Tooltip>
                <PopoverTrigger
                  nativeButton={false}
                  render={
                    <TooltipTrigger
                      render={
                        <span
                          onClick={handleChallengeBadgeClick}
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''} ${
                            isChallengeOverridden
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700'
                              : 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                          }`}
                        />
                      }
                    />
                  }
                >
                  <TimerIcon className="size-3" />
                  {displayedChallengeTime}s ⚡
                </PopoverTrigger>
                <TooltipContent>
                  {intl.formatMessage(
                    isChallengeOverridden ? messages.challengeTimeOverridden : messages.challengeTimeInherited
                  )}
                </TooltipContent>
              </Tooltip>
            )}
            <PopoverContent align="center" side="bottom" className="w-auto p-4 min-w-[240px]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="challenge-time-input">{intl.formatMessage(messages.editChallengeTime)}</Label>
                  <Input
                    id="challenge-time-input"
                    type="number"
                    value={editValueChallenge}
                    onChange={(e) => setEditValueChallenge(e.target.value)}
                    min={Timer.MIN_CHALLENGE_TIME_SECONDS}
                    max={Timer.MAX_CHALLENGE_TIME_SECONDS}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {isChallengeOverridden && roundChallengeTime != null && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleResetChallengeToRound}
                      disabled={isSavingChallenge}
                      className="text-amber-500 hover:bg-amber-500/10"
                    >
                      {intl.formatMessage(messages.resetToRound)}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      const num = Number(editValueChallenge);
                      if (num >= Timer.MIN_CHALLENGE_TIME_SECONDS && num <= Timer.MAX_CHALLENGE_TIME_SECONDS)
                        handleSaveChallengeTime(num);
                    }}
                    disabled={
                      isSavingChallenge ||
                      !editValueChallenge ||
                      Number(editValueChallenge) < Timer.MIN_CHALLENGE_TIME_SECONDS ||
                      Number(editValueChallenge) > Timer.MAX_CHALLENGE_TIME_SECONDS
                    }
                  >
                    {intl.formatMessage(globalMessages.save)}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-sky-500 hover:scale-110 transition-transform"
                />
              }
            >
              {isCollapsed ? <ChevronDown /> : <ChevronUp />}
            </TooltipTrigger>
            <TooltipContent>{isCollapsed ? 'Expand' : 'Collapse'}</TooltipContent>
          </Tooltip>
          {status === GameStatus.GAME_EDIT && canEdit && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-primary hover:scale-110 transition-transform"
                    onClick={() => setEditDialogOpen(true)}
                  />
                }
              >
                <Pencil />
              </TooltipTrigger>
              <TooltipContent>{intl.formatMessage(messages.editQuestion)}</TooltipContent>
            </Tooltip>
          )}
          {status === GameStatus.GAME_EDIT && (
            <RemoveQuestionFromRoundButton roundId={roundId} questionId={questionId} />
          )}
        </div>
        {/* <UpdateCreatorButton roundId={roundId} questionId={questionId} /> */}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="flex flex-col justify-center items-center w-full p-4 bg-linear-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50">
          <QuestionCardContent baseQuestion={baseQuestion} />
        </CardContent>
      )}

      <EditQuestionDialog baseQuestion={baseQuestion} open={editDialogOpen} onClose={closeEditDialog} />
    </Card>
  );
}

function QuestionCardSkeleton() {
  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-linear-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-900 py-2 px-3 border-b border-slate-200 dark:border-slate-700">
        <div className="h-4 w-2/3 rounded-sm bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 bg-linear-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50">
        <div className="h-36 w-full rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-5/6 rounded-sm bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-2/3 rounded-sm bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </CardContent>
    </Card>
  );
}

interface EditQuestionDialogProps {
  baseQuestion: AnyBaseQuestion;
  open: boolean;
  onClose: () => void;
}

function EditQuestionDialog({ baseQuestion, open, onClose }: EditQuestionDialogProps) {
  const intl = useIntl();
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{intl.formatMessage(messages.editQuestionDialogTitle)}</DialogTitle>
        </DialogHeader>
        <EditQuestionFormByType baseQuestion={baseQuestion} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

interface EditQuestionFormByTypeProps {
  baseQuestion: AnyBaseQuestion;
  onClose: () => void;
}

function EditQuestionFormByType({ baseQuestion, onClose }: EditQuestionFormByTypeProps) {
  const commonProps = {
    questionToEdit: baseQuestion as unknown as Record<string, unknown>,
    inGameEditor: true,
    onDialogClose: onClose,
  };
  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <SubmitBasicQuestionForm {...commonProps} />;
    case QuestionType.BLINDTEST:
      return <SubmitBlindtestQuestionForm {...commonProps} />;
    case QuestionType.EMOJI:
      return <SubmitEmojiQuestionForm {...commonProps} />;
    case QuestionType.ENUMERATION:
      return <SubmitEnumerationQuestionForm {...commonProps} />;
    case QuestionType.ESTIMATION:
      return <SubmitEstimationQuestionForm {...commonProps} />;
    case QuestionType.IMAGE:
      return <SubmitImageQuestionForm {...commonProps} />;
    case QuestionType.LABELLING:
      return <SubmitLabellingQuestionForm {...commonProps} />;
    case QuestionType.MATCHING:
      return <SubmitMatchingQuestionForm {...commonProps} />;
    case QuestionType.MCQ:
      return <SubmitMCQForm {...commonProps} />;
    case QuestionType.NAGUI:
      return <SubmitNaguiQuestionForm {...commonProps} />;
    case QuestionType.ODD_ONE_OUT:
      return <SubmitOddOneOutQuestionForm {...commonProps} />;
    case QuestionType.PROGRESSIVE_CLUES:
      return <SubmitProgressiveCluesQuestionForm {...commonProps} />;
    case QuestionType.QUOTE:
      return <SubmitQuoteQuestionForm {...commonProps} />;
    case QuestionType.REORDERING:
      return <SubmitReorderingQuestionForm {...commonProps} />;
    default:
      return null;
  }
}

interface RemoveQuestionFromRoundButtonProps {
  roundId: string;
  questionId: string;
}

function RemoveQuestionFromRoundButton({ roundId, questionId }: RemoveQuestionFromRoundButtonProps) {
  const intl = useIntl();
  const gameId = useGameId();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [handleRemoveQuestion, isRemoving] = useAsyncAction(async () => {
    await removeRoundQuestion(gameId, roundId, questionId);
  });

  const onCancel = () => {
    setDialogOpen(false);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => setDialogOpen(true)}
        disabled={isRemoving}
      >
        <Trash2 />
      </Button>

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
            <Button onClick={handleRemoveQuestion} disabled={isRemoving}>
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
