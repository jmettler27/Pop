import {
  removeQuestionFromRound,
  updateQuestionThinkingTime,
  updateQuestionChallengeTime,
} from '@/backend/services/edit-game/actions';
import { Timer } from '@/backend/models/Timer';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import React, { useState, memo } from 'react';

import { CardTitle, CardHeader, CardContent, Card, CardFooter } from '@/frontend/components/card';
import { QuestionCardTitle, QuestionCardContent } from '@/frontend/components/common/QuestionCard';

import useAsyncAction from '@/frontend/hooks/useAsyncAction';

import globalMessages from '@/i18n/globalMessages';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import SubmitBasicQuestionForm from '@/frontend/components/question-forms/SubmitBasicQuestionForm';
import SubmitBlindtestQuestionForm from '@/frontend/components/question-forms/SubmitBlindtestQuestionForm';
import SubmitEmojiQuestionForm from '@/frontend/components/question-forms/SubmitEmojiQuestionForm';
import SubmitEnumerationQuestionForm from '@/frontend/components/question-forms/SubmitEnumerationQuestionForm';
import SubmitImageQuestionForm from '@/frontend/components/question-forms/SubmitImageQuestionForm';
import SubmitLabellingQuestionForm from '@/frontend/components/question-forms/SubmitLabellingQuestionForm';
import SubmitMatchingQuestionForm from '@/frontend/components/question-forms/SubmitMatchingQuestionForm';
import SubmitMCQForm from '@/frontend/components/question-forms/SubmitMCQQuestionForm';
import SubmitNaguiQuestionForm from '@/frontend/components/question-forms/SubmitNaguiQuestionForm';
import SubmitOddOneOutQuestionForm from '@/frontend/components/question-forms/SubmitOddOneOutQuestionForm';
import SubmitProgressiveCluesQuestionForm from '@/frontend/components/question-forms/SubmitProgressiveCluesQuestionForm';
import SubmitQuoteQuestionForm from '@/frontend/components/question-forms/SubmitQuoteQuestionForm';
import SubmitReorderingQuestionForm from '@/frontend/components/question-forms/SubmitReorderingQuestionForm';

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

import { Avatar, Button, Divider, Popover, TextField } from '@mui/material';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimerIcon from '@mui/icons-material/Timer';

export const EditQuestionCard = memo(function EditQuestionCard({
  roundId,
  questionId,
  questionOrder,
  status,
  roundThinkingTime,
  roundChallengeTime,
}) {
  const { id: gameId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log('EditQuestionCard', gameId, roundId, questionId);

  const baseQuestionRepo = new BaseQuestionRepository();
  const {
    baseQuestion,
    loading: baseQuestionLoading,
    error: baseQuestionError,
  } = baseQuestionRepo.useQuestion(questionId);

  if (baseQuestionError) {
    return <p>Error: {JSON.stringify(baseQuestionError)}</p>;
  }
  if (baseQuestionLoading) {
    return <QuestionCardSkeleton />;
  }
  if (!baseQuestion) {
    return <QuestionCardSkeleton />;
  }

  return (
    <EditQuestionCardInner
      baseQuestion={baseQuestion}
      gameId={gameId}
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
}) {
  const intl = useIntl();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const canEdit = userId && baseQuestion.createdBy === userId;

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(baseQuestion.type, gameId, roundId);
  const { gameQuestion } = gameQuestionRepo.useQuestion(questionId);

  const questionThinkingTime = gameQuestion?.thinkingTime;
  const isOverridden =
    questionThinkingTime != null && roundThinkingTime != null && questionThinkingTime !== roundThinkingTime;

  const [anchorEl, setAnchorEl] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [handleSaveThinkingTime, isSaving] = useAsyncAction(async (value) => {
    await updateQuestionThinkingTime(gameId, baseQuestion.type, roundId, questionId, value);
    setAnchorEl(null);
  });

  const handleBadgeClick = (event) => {
    if (status !== GameStatus.GAME_EDIT) return;
    setEditValue(questionThinkingTime ?? roundThinkingTime ?? '');
    setAnchorEl(event.currentTarget);
  };

  const handleResetToRound = () => {
    if (roundThinkingTime != null) {
      handleSaveThinkingTime(roundThinkingTime);
    }
  };

  const questionChallengeTime = gameQuestion?.challengeTime;
  const displayedChallengeTime = questionChallengeTime ?? roundChallengeTime;
  const isChallengeOverridden =
    questionChallengeTime != null && roundChallengeTime != null && questionChallengeTime !== roundChallengeTime;

  const [anchorElChallenge, setAnchorElChallenge] = useState(null);
  const [editValueChallenge, setEditValueChallenge] = useState('');
  const [handleSaveChallengeTime, isSavingChallenge] = useAsyncAction(async (value) => {
    await updateQuestionChallengeTime(gameId, baseQuestion.type, roundId, questionId, value);
    setAnchorElChallenge(null);
  });

  const handleChallengeBadgeClick = (event) => {
    if (status !== GameStatus.GAME_EDIT) return;
    setEditValueChallenge(displayedChallengeTime ?? '');
    setAnchorElChallenge(event.currentTarget);
  };

  const handleResetChallengeToRound = () => {
    if (roundChallengeTime != null) {
      handleSaveChallengeTime(roundChallengeTime);
    }
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-xl overflow-hidden group hover:scale-[1.02]">
      <CardHeader
        className={`flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-900 py-2 px-3 ${!isCollapsed ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
      >
        {/* <span className='text-base md:text-lg dark:text-white'>#{questionOrder + 1}</span> */}
        <CardTitle className="text-sm md:text-base dark:text-white font-semibold">
          <QuestionCardTitle baseQuestion={baseQuestion} showType={true} />
        </CardTitle>
        <div className="flex gap-1 items-center">
          {questionThinkingTime != null && (
            <Tooltip
              title={intl.formatMessage(
                isOverridden ? messages.thinkingTimeOverridden : messages.thinkingTimeInherited
              )}
            >
              <span
                onClick={handleBadgeClick}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''} ${
                  isOverridden
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                <TimerIcon sx={{ fontSize: 12 }} />
                {questionThinkingTime}s
              </span>
            </Tooltip>
          )}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <div className="p-4 flex flex-col gap-3 min-w-[240px]">
              <TextField
                label={intl.formatMessage(messages.editThinkingTime)}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                inputProps={{ min: Timer.MIN_THINKING_TIME_SECONDS, max: Timer.MAX_THINKING_TIME_SECONDS }}
                autoFocus
                fullWidth
              />
              <div className="flex gap-2 justify-end">
                {isOverridden && roundThinkingTime != null && (
                  <Button size="small" onClick={handleResetToRound} disabled={isSaving} color="warning">
                    {intl.formatMessage(messages.resetToRound)}
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
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
          </Popover>
          {displayedChallengeTime != null && (
            <Tooltip
              title={intl.formatMessage(
                isChallengeOverridden ? messages.challengeTimeOverridden : messages.challengeTimeInherited
              )}
            >
              <span
                onClick={handleChallengeBadgeClick}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${status === GameStatus.GAME_EDIT ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''} ${
                  isChallengeOverridden
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-300 dark:ring-orange-700'
                    : 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                }`}
              >
                <TimerIcon sx={{ fontSize: 12 }} />
                {displayedChallengeTime}s ⚡
              </span>
            </Tooltip>
          )}
          <Popover
            open={Boolean(anchorElChallenge)}
            anchorEl={anchorElChallenge}
            onClose={() => setAnchorElChallenge(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <div className="p-4 flex flex-col gap-3 min-w-[240px]">
              <TextField
                label={intl.formatMessage(messages.editChallengeTime)}
                type="number"
                value={editValueChallenge}
                onChange={(e) => setEditValueChallenge(e.target.value)}
                inputProps={{ min: Timer.MIN_CHALLENGE_TIME_SECONDS, max: Timer.MAX_CHALLENGE_TIME_SECONDS }}
                autoFocus
                fullWidth
              />
              <div className="flex gap-2 justify-end">
                {isChallengeOverridden && roundChallengeTime != null && (
                  <Button
                    size="small"
                    onClick={handleResetChallengeToRound}
                    disabled={isSavingChallenge}
                    color="warning"
                  >
                    {intl.formatMessage(messages.resetToRound)}
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
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
          </Popover>
          <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              size="small"
              color="info"
              className="hover:scale-110 transition-transform"
            >
              {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {status === GameStatus.GAME_EDIT && canEdit && (
            <Tooltip title={intl.formatMessage(messages.editQuestion)}>
              <IconButton
                color="primary"
                onClick={() => setEditDialogOpen(true)}
                size="small"
                className="hover:scale-110 transition-transform"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {status === GameStatus.GAME_EDIT && (
            <RemoveQuestionFromRoundButton questionType={baseQuestion.type} roundId={roundId} questionId={questionId} />
          )}
        </div>
        {/* <UpdateCreatorButton roundId={roundId} questionId={questionId} /> */}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="flex flex-col justify-center items-center w-full p-4 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50">
          <QuestionCardContent baseQuestion={baseQuestion} />
        </CardContent>
      )}

      <EditQuestionDialog
        baseQuestion={baseQuestion}
        userId={userId}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />
    </Card>
  );
}

function QuestionCardSkeleton() {
  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-900 py-2 px-3 border-b border-slate-200 dark:border-slate-700">
        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="flex gap-1">
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50">
        <div className="h-36 w-full rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </CardContent>
    </Card>
  );
}

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import { GameStatus } from '@/backend/models/games/GameStatus';

function EditQuestionDialog({ baseQuestion, userId, open, onClose }) {
  const intl = useIntl();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>{intl.formatMessage(messages.editQuestionDialogTitle)}</DialogTitle>
      <DialogContent>
        <EditQuestionFormByType baseQuestion={baseQuestion} userId={userId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function EditQuestionFormByType({ baseQuestion, userId, onClose }) {
  const commonProps = { userId, questionToEdit: baseQuestion, inGameEditor: true, onDialogClose: onClose };
  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <SubmitBasicQuestionForm {...commonProps} />;
    case QuestionType.BLINDTEST:
      return <SubmitBlindtestQuestionForm {...commonProps} />;
    case QuestionType.EMOJI:
      return <SubmitEmojiQuestionForm {...commonProps} />;
    case QuestionType.ENUMERATION:
      return <SubmitEnumerationQuestionForm {...commonProps} />;
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

function RemoveQuestionFromRoundButton({ questionType, roundId, questionId }) {
  const intl = useIntl();
  const { id: gameId } = useParams();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [handleRemoveQuestion, isRemoving] = useAsyncAction(async () => {
    await removeQuestionFromRound(questionType, gameId, roundId, questionId);
  });

  const onCancel = () => {
    setDialogOpen(false);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <IconButton color="error" onClick={() => setDialogOpen(true)} disabled={isRemoving}>
        <DeleteIcon />
      </IconButton>

      <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
        <DialogTitle>{intl.formatMessage(messages.deleteDialogTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText>{intl.formatMessage(globalMessages.dialogWarning)}</DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleRemoveQuestion} disabled={isRemoving}>
            {intl.formatMessage(messages.deleteDialogConfirm)}
          </Button>

          <Button variant="outlined" color="error" onClick={onCancel}>
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
