'use client';

import { topicToEmoji } from '@/backend/models/Topic';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { RoundType, roundTypeToEmoji, roundTypeToTitle } from '@/backend/models/rounds/RoundType';
import { Round } from '@/backend/models/rounds/Round';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import RoundRepository from '@/backend/repositories/round/RoundRepository';

import { removeRoundFromGame } from '@/backend/services/edit-game/edit-game';
import { updateRound } from '@/backend/services/edit-game/actions';

import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/frontend/texts/dialogs';

import { QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useParams } from 'next/navigation';

import React, { memo, useEffect, useState } from 'react';

import { CardTitle, CardHeader, CardContent, Card } from '@/frontend/components/card';
import { EditQuestionCard } from '@/frontend/components/game-editor/EditQuestionInRound';
import {
  AddQuestionToMixedRoundButton,
  AddQuestionToRoundButton,
} from '@/frontend/components/game-editor/AddNewQuestion';
import { QuestionCardTitle } from '@/frontend/components/questions/QuestionCard';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import clsx from 'clsx';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

const editGameRoundCardNumCols = (roundType) => {
  switch (roundType) {
    case RoundType.PROGRESSIVE_CLUES:
    case RoundType.MATCHING:
      return 'md:grid-cols-2';
    case RoundType.ODD_ONE_OUT:
    case RoundType.ENUMERATION:
    case RoundType.MCQ:
    case RoundType.NAGUI:
    case RoundType.BASIC:
    case RoundType.QUOTE:
    case RoundType.LABELLING:
    case RoundType.REORDERING:
      return 'md:grid-cols-3';
    default:
      return 'md:grid-cols-4';
  }
};

export const EditGameRoundCard = memo(function EditGameRoundCard({ roundId, status, gameId, forceCollapse = false }) {
  // <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>

  const roundRepo = new RoundRepository(gameId);
  const { round, loading, error } = roundRepo.useRound(roundId);

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedQuestions, setReorderedQuestions] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync with forceCollapse prop
  useEffect(() => {
    setIsCollapsed(forceCollapse);
  }, [forceCollapse]);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!round) {
    return <></>;
  }

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
      // Serialize round data to plain object (convert Timestamps to ISO strings)
      const roundObj = round.toObject();
      const updatedRoundData = {
        ...roundObj,
        questions: reorderedQuestions,
        createdAt: roundObj.createdAt?.toDate?.() ? roundObj.createdAt.toDate().toISOString() : roundObj.createdAt,
        dateStart: roundObj.dateStart?.toDate?.() ? roundObj.dateStart.toDate().toISOString() : roundObj.dateStart,
        dateEnd: roundObj.dateEnd?.toDate?.() ? roundObj.dateEnd.toDate().toISOString() : roundObj.dateEnd,
      };

      await updateRound(gameId, round.id, updatedRoundData);
      setIsReorderMode(false);
    } catch (error) {
      console.error('Failed to reorder questions:', error);
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 space-y-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-row items-center gap-5 min-w-0">
          <Tooltip title={roundTypeToTitle(round.type, DEFAULT_LOCALE)}>
            <span className="text-xl shrink-0">{roundTypeToEmoji(round.type)}</span>
          </Tooltip>
          <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2 min-w-0">
            <i className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pr-1">
              {round.title}
            </i>
          </CardTitle>
          <div className="hidden sm:flex ml-2">
            <RoundTopicDistribution round={round} />
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:scale-110 transition-transform"
              color="info"
            >
              {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Tooltip>
          {status === GameStatus.GAME_EDIT && (
            <>
              <Tooltip title={isReorderMode ? 'Stop reordering' : 'Reorder questions'}>
                <IconButton
                  color={isReorderMode ? 'warning' : 'info'}
                  onClick={handleToggleReorderMode}
                  className="hover:scale-110 transition-transform"
                >
                  {isReorderMode ? <CloseIcon /> : <SwapVertIcon />}
                </IconButton>
              </Tooltip>
              {isReorderMode && (
                <IconButton
                  color="success"
                  onClick={handleConfirmReorder}
                  className="hover:scale-110 transition-transform"
                >
                  <CheckIcon />
                </IconButton>
              )}
              {!isReorderMode && <RemoveRoundFromGameButton roundId={round.id} />}
            </>
          )}
        </div>
      </CardHeader>
      <div className="sm:hidden px-4 pt-2">
        <RoundTopicDistribution round={round} />
      </div>
      {!isCollapsed && (
        <CardContent className="p-6 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/50">
          <EditGameRoundQuestionCards
            round={round}
            status={status}
            isReorderMode={isReorderMode}
            reorderedQuestions={reorderedQuestions}
            setReorderedQuestions={setReorderedQuestions}
            roundCollapsed={isCollapsed}
          />
          {status === GameStatus.GAME_EDIT &&
            !isReorderMode &&
            (round.type === RoundType.MIXED ? (
              <AddQuestionToMixedRoundButton
                roundId={round.id}
                disabled={round.questions.length >= Round.MAX_NUM_QUESTIONS}
              />
            ) : (
              <AddQuestionToRoundButton round={round} disabled={round.questions.length >= Round.MAX_NUM_QUESTIONS} />
            ))}
        </CardContent>
      )}
    </Card>
  );
});

function SortableQuestionCard({ roundId, questionId, questionOrder, status }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: questionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const baseQuestionRepo = new BaseQuestionRepository();
  const { baseQuestion, loading, error } = baseQuestionRepo.useQuestionOnce(questionId);

  if (error) {
    return <p>Error: {JSON.stringify(error)}</p>;
  }
  if (loading) {
    return <p>Loading the question...</p>;
  }
  if (!baseQuestion) {
    return <p>No data...</p>;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className="border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3 py-3 px-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-1 transition-colors"
          >
            <DragIndicatorIcon className="text-slate-400 dark:text-slate-500" />
          </div>
          <CardTitle className="text-base md:text-lg dark:text-white flex-grow font-medium">
            <span className="mr-2 font-bold text-blue-600 dark:text-blue-400">#{questionOrder + 1}</span>
            <QuestionCardTitle baseQuestion={baseQuestion} showType={true} />
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

const fetchTopics = async (questionIds) => {
  const promises = questionIds.map((id) => getDoc(doc(QUESTIONS_COLLECTION_REF, id)));
  const documents = await Promise.all(promises);
  return documents.map((doc) => doc.data().topic);
};

function RoundTopicDistribution({ round }) {
  const { questions: ids } = round;

  const [topics, setTopics] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchTopics(ids).then(
      (topics) => {
        const topicDistribution = topics.reduce((acc, topic) => {
          acc[topic] = acc[topic] ? acc[topic] + 1 : 1;
          return acc;
        }, {});

        // Sort alphabetically by the keys
        const sortedTopics = Object.keys(topicDistribution)
          .sort()
          .reduce((acc, key) => {
            acc[key] = topicDistribution[key];
            return acc;
          }, {});

        setTopics(sortedTopics);
      },
      (error) => {
        console.error('Error fetching topics', error);
      }
    );
  }, [ids]);

  const totalQuestions = ids.length;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" suppressHydrationWarning>
      {/* Total questions badge */}
      <span className="inline-flex items-center px-3 py-1.5 rounded-full font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
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
      {isMounted && Object.entries(topics).length > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600 text-lg">•</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(topics).map(([topic, count]) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-lg">{topicToEmoji(topic)}</span>
                <span className="text-xs font-bold">{count}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EditGameRoundQuestionCards({ round, status, isReorderMode, reorderedQuestions, setReorderedQuestions }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id !== over.id) {
      setReorderedQuestions((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        return newOrder;
      });
    }
  };

  const questionIds = isReorderMode ? reorderedQuestions : round.questions;

  if (isReorderMode) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {questionIds.map((questionId, idx) => (
              <SortableQuestionCard
                key={questionId}
                roundId={round.id}
                questionId={questionId}
                questionOrder={idx}
                status={status}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className={clsx('grid', 'gap-4', 'items-start', editGameRoundCardNumCols(round.type))}>
      {questionIds.map((questionId, idx) => (
        <EditQuestionCard
          key={questionId}
          roundId={round.id}
          questionId={questionId}
          questionOrder={idx}
          status={status}
        />
      ))}
    </div>
  );
}

function RemoveRoundFromGameButton({ roundId, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [handleRemoveRound, isRemoving] = useAsyncAction(async () => {
    await removeRoundFromGame(gameId, roundId);
  });

  const onCancel = () => {
    setDialogOpen(false);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip title="Delete round">
        <IconButton color="error" onClick={() => setDialogOpen(true)} disabled={isRemoving}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>

      <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
        <DialogTitle>{REMOVE_ROUND_FROM_GAME_DIALOG_TITLE[lang]}</DialogTitle>

        <DialogContent>
          <DialogContentText>{DIALOG_WARNING[lang]}</DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleRemoveRound} disabled={isRemoving}>
            {REMOVE_ROUND_FROM_GAME_DIALOG_ACTION_VALIDATE[lang]}
          </Button>

          <Button variant="outlined" color="error" onClick={onCancel}>
            {DIALOG_ACTION_CANCEL[lang]}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const REMOVE_ROUND_FROM_GAME_DIALOG_TITLE = {
  en: 'Are you sure you want to remove this round?',
  'fr-FR': "T'es sûr de vouloir supprimer cette manche ?",
};

const REMOVE_ROUND_FROM_GAME_DIALOG_ACTION_VALIDATE = {
  en: 'Yes',
  'fr-FR': 'Oui',
};
