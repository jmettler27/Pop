'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Accordion, AccordionDetails, AccordionSummary, ListItemIcon, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import defineMessages from '@/frontend/i18n/defineMessages';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { ReorderingItem, ReorderingQuestion } from '@/models/questions/reordering';
import { topicToEmoji } from '@/models/topic';
import type { Topic } from '@/models/topic';

export const messages = defineMessages('frontend.game.middle.ReorderingMiddlePane', {
  submitOrdering: 'Submit ordering',
  confirmDialogTitle: 'Are you sure you want to submit this ordering?',
  confirmDialogMessage: 'Please review your ordering before submitting:',
  teammateSubmitted: 'Your teammate has already submitted!',
  youSubmitted: 'Your ordering has been submitted!',
  yourScore: 'Your score: {score}/{maxScore}',
  youPlaced: 'You placed this #{position}',
});

export function ReorderingQuestionHeader({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
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

interface ReorderingItemAccordionProps {
  item: ReorderingItem;
  displayOrder: number;
  expanded: boolean;
  onAccordionChange: () => void;
  teamSubmitted?: boolean;
  teamPlacedAt?: number;
  isCorrect?: boolean;
}

export function ReorderingItemAccordion({
  item,
  displayOrder,
  expanded,
  onAccordionChange,
  teamSubmitted = false,
  teamPlacedAt,
  isCorrect,
}: ReorderingItemAccordionProps) {
  const intl = useIntl();

  return (
    <Accordion
      className="flex-grow"
      expanded={expanded}
      onChange={onAccordionChange}
      disabled={false}
      disableGutters
      sx={{
        ...(teamSubmitted && {
          borderLeft: '4px solid',
          borderLeftColor: isCorrect ? 'success.main' : 'error.main',
          bgcolor: isCorrect ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)',
        }),
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <ListItemIcon className="flex items-center">
          {teamSubmitted &&
            (isCorrect ? (
              <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
            ) : (
              <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
            ))}
          <Typography variant="h6" className="font-bold">
            {displayOrder + 1}.
          </Typography>
        </ListItemIcon>
        <div className="flex flex-col flex-grow">
          <Typography sx={{ marginRight: '10px' }} variant="h6">
            {item.title}
          </Typography>
          {teamSubmitted && !isCorrect && teamPlacedAt !== undefined && (
            <div className="flex items-center text-sm text-red-500 dark:text-red-400 mt-1">
              <SwapVertIcon fontSize="small" className="mr-1" />
              <span>{intl.formatMessage(messages.youPlaced, { position: teamPlacedAt + 1 })}</span>
            </div>
          )}
        </div>
      </AccordionSummary>

      <AccordionDetails>
        <Typography sx={{ color: 'text.secondary' }} variant="h6">
          {item.explanation}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
