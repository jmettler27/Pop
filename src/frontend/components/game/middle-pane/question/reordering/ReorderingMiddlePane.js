'use client';

import { useState, useMemo, use } from 'react';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { clsx } from 'clsx';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  // arrayMove,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemButton,
  ListItemIcon,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { useGameContext, useTeamContext, useUserContext, useRoleContext } from '@/frontend/contexts';
import { GameStatus } from '@/backend/models/games/GameStatus';
import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';
import LoadingScreen from '@/frontend/components/LoadingScreen';
// import QuestionTypeIcon from '@/frontend/components/game/QuestionTypeIcon';
// import { topicToEmoji, questionTypeToTitle } from '@/frontend/utils/string';
// import CurrentRoundQuestionOrder from '@/frontend/components/game/CurrentRoundQuestionOrder';
import { QuestionTypeIcon } from '@/backend/utils/question_types';
import { topicToEmoji } from '@/backend/models/Topic';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import CurrentRoundQuestionOrder from '@/frontend/components/game/middle-pane/question/QuestionHeader';

import NoteButton from '@/frontend/components/game/NoteButton';
import { shuffleIndices } from '@/backend/utils/arrays';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import { submitOrdering } from '@/backend/services/question/reordering/actions';
import { ParticipantRole } from '@/backend/models/users/Participant';

const messages = defineMessages('frontend.game.middle.ReorderingMiddlePane', {
  submitOrdering: 'Submit ordering',
  confirmDialogTitle: 'Are you sure you want to submit this ordering?',
  confirmDialogMessage: 'Please review your ordering before submitting:',
  teammateSubmitted: 'Your teammate has already submitted!',
  youSubmitted: 'Your ordering has been submitted!',
});

export default function ReorderingMiddlePane({ baseQuestion }) {
  const game = useGameContext();
  const myTeam = useTeamContext();
  const myRole = useRoleContext();

  // Initialize random order
  const randomMapping = useMemo(() => shuffleIndices(baseQuestion.items.length), [baseQuestion.items.length]);

  // Get game question data
  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <LoadingScreen />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <ReorderingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {(game.status === GameStatus.QUESTION_END || myRole === ParticipantRole.ORGANIZER) && (
          <ReorderingItemsDisplayEnd baseQuestion={baseQuestion} />
        )}
        {game.status === GameStatus.QUESTION_ACTIVE && myRole === ParticipantRole.PLAYER && (
          <ReorderingItemsEditable
            baseQuestion={baseQuestion}
            gameQuestion={gameQuestion}
            randomMapping={randomMapping}
            myTeam={myTeam}
          />
        )}
        {game.status === GameStatus.QUESTION_ACTIVE && myRole === ParticipantRole.SPECTATOR && (
          <ReorderingItemsSpectator baseQuestion={baseQuestion} randomMapping={randomMapping} />
        )}
      </div>
    </div>
  );
}

function ReorderingQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-4xl">{baseQuestion.title}</h2>
        {baseQuestion.note && <NoteButton note={baseQuestion.note} />}
      </div>
    </div>
  );
}

function ReorderingItemsEditable({ baseQuestion, gameQuestion, randomMapping, myTeam }) {
  const intl = useIntl();
  const game = useGameContext();
  const user = useUserContext();
  const [orderedIndices, setOrderedIndices] = useState(randomMapping);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedIndices.indexOf(active.id);
      const newIndex = orderedIndices.indexOf(over.id);
      setOrderedIndices(arrayMove(orderedIndices, oldIndex, newIndex));
    }
  };

  // Check if this team has already submitted
  const teamSubmitted = gameQuestion.orderings?.some((o) => o.teamId === myTeam);
  const teamSubmission = gameQuestion.orderings?.find((o) => o.teamId === myTeam);
  const submittedByMe = teamSubmission?.playerId === user.id;

  const [handleSubmitOrdering, isSubmitting] = useAsyncAction(async () => {
    await submitOrdering(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, orderedIndices);
    setDialogOpen(false);
  });

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  if (teamSubmitted && teamSubmission) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4 space-y-4">
        <List className="rounded-lg max-h-[80%] w-1/2 overflow-y-auto mb-3 bg-white dark:bg-slate-900">
          {teamSubmission.ordering.map((idx, displayOrder) => (
            <ListItemButton key={idx} divider={displayOrder !== teamSubmission.ordering.length - 1} disabled>
              <Typography variant="h6" className="flex items-center">
                <span className="mr-4 font-bold text-lg">{displayOrder + 1}.</span>
                {baseQuestion.items[idx].title}
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
            {orderedIndices.map((idx, displayOrder) => (
              <ReorderingItemDraggable
                key={idx}
                itemIdx={idx}
                displayOrder={displayOrder}
                item={baseQuestion.items[idx]}
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
            {orderedIndices.map((idx, position) => (
              <li key={position} className="text-md">
                {baseQuestion.items[idx].title}
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

function ReorderingItemDraggable({ itemIdx, displayOrder, item, isLast, disabled }) {
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
              {item.title}
            </Typography>
          </div>
        </ListItemButton>
      </div>
    </div>
  );
}

function ReorderingItemsSpectator({ baseQuestion, randomMapping }) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <List className="rounded-2xl w-[55%] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70">
        {randomMapping.map((idx, displayOrder) => (
          <div key={idx} className="flex items-center mb-2">
            <div className="w-10 pr-2 text-right font-bold text-lg text-slate-400 dark:text-slate-500">
              {displayOrder + 1}.
            </div>
            <ListItemButton
              divider={false}
              disabled
              className="rounded-xl flex-1"
              sx={{
                bgcolor: '#0f172a',
                borderRadius: 3,
                border: '1px solid',
                borderColor: '#1f2937',
                boxShadow: '0 6px 16px rgba(2, 6, 23, 0.35)',
                py: 1.25,
                '&.Mui-disabled': {
                  opacity: 0.75,
                },
              }}
            >
              <Typography variant="h6" className="flex items-center text-slate-100">
                {baseQuestion.items[idx].title}
              </Typography>
            </ListItemButton>
          </div>
        ))}
      </List>
    </div>
  );
}

function ReorderingItemsDisplayEnd({ baseQuestion }) {
  const [expandedIdx, setExpandedIdx] = useState(false);
  const displayOrder = baseQuestion.items.map((_, i) => i);

  const handleAccordionChange = (idx) => {
    setExpandedIdx(expandedIdx === idx ? false : idx);
  };

  return (
    <List className="rounded-lg max-h-[90%] w-1/2 overflow-y-auto mb-3 bg-white dark:bg-slate-900">
      {displayOrder.map((idx, position) => (
        <ReorderingItemDisplayEnd
          key={idx}
          item={baseQuestion.items[idx]}
          displayOrder={position}
          expanded={expandedIdx === idx}
          onAccordionChange={() => handleAccordionChange(idx)}
          isLast={position === displayOrder.length - 1}
        />
      ))}
    </List>
  );
}

function ReorderingItemDisplayEnd({ item, displayOrder, expanded, onAccordionChange, isLast }) {
  return (
    <Accordion className="flex-grow" expanded={expanded} onChange={onAccordionChange} disabled={false} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <ListItemIcon>
          <Typography variant="h6" className="ml-2 font-bold">
            {displayOrder + 1}.
          </Typography>
        </ListItemIcon>
        <Typography sx={{ marginRight: '10px' }} variant="h6">
          {item.title}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Typography sx={{ color: 'text.secondary' }} variant="h6">
          {item.explanation}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
