import { removeQuestionFromRound } from '@/backend/services/edit-game/actions';

import { useParams } from 'next/navigation';

import React, { useState, memo } from 'react';

import { CardTitle, CardHeader, CardContent, Card, CardFooter } from '@/frontend/components/card';
import { QuestionCardTitle, QuestionCardContent } from '@/frontend/components/questions/QuestionCard';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import globalMessages from '@/i18n/globalMessages';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.gameEditor.EditQuestionInRound', {
  deleteDialogTitle: 'Are you sure you want to remove this question?',
  deleteDialogConfirm: 'Yes',
});

import { Avatar, Button, Divider } from '@mui/material';
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export const EditQuestionCard = memo(function EditQuestionCard({ roundId, questionId, questionOrder, status }) {
  const { id: gameId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log('EditQuestionCard', gameId, roundId, questionId);

  const baseQuestionRepo = new BaseQuestionRepository();
  const {
    baseQuestion,
    loading: baseQuestionLoading,
    error: baseQuestionError,
  } = baseQuestionRepo.useQuestionOnce(questionId);

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
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-xl overflow-hidden group hover:scale-[1.02]">
      <CardHeader
        className={`flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-900 py-2 px-3 ${!isCollapsed ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}
      >
        {/* <span className='text-base md:text-lg dark:text-white'>#{questionOrder + 1}</span> */}
        <CardTitle className="text-sm md:text-base dark:text-white font-semibold">
          <QuestionCardTitle baseQuestion={baseQuestion} showType={true} />
        </CardTitle>
        <div className="flex gap-1">
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
          {status === 'build' && (
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
    </Card>
  );
});

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

import PersonIcon from '@mui/icons-material/Person';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import GameQuestionRepository from '@/backend/repositories/question/GameQuestionRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';

function UpdateCreatorButton({ roundId, questionId }) {
  const { id: gameId } = useParams();

  const [handleChange, isChanging] = useAsyncAction(async () => {
    // await updateQuestionCreator(gameId, roundId, questionId, '')
  });

  return (
    <>
      <IconButton color="error" onClick={handleChange} disabled={isChanging}>
        <PersonIcon />
      </IconButton>
    </>
  );
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
