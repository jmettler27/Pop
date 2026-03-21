import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, ButtonGroup, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import {
  cancelPlayer,
  handleBuzzerHeadChanged,
  validateAllLabels,
} from '@/backend/services/question/labelling/actions';
import { isEmpty } from '@/backend/utils/arrays';
import BuzzerHeadPlayer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';
import ClearBuzzerButton from '@/frontend/components/game/main-pane/question/buzzer/ClearBuzzerButton';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import RevealLabelButton from '@/frontend/components/game/main-pane/question/labelling/RevealLabelButton.js';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/i18n/globalMessages';

export default function LabellingOrganizerController({ baseQuestion, questionPlayers }) {
  const { id: gameId } = useParams();

  const game = useGame();

  /* Set the state 'focus' to the playerId which is the first element of the buzzed list */
  const { buzzed } = questionPlayers;
  const buzzerHead = useRef();

  useEffect(() => {
    if (!buzzed || buzzed.length === 0) {
      buzzerHead.current = null;
      return;
    }
    if (buzzerHead.current !== buzzed[0]) {
      buzzerHead.current = buzzed[0];
      handleBuzzerHeadChanged(gameId, game.currentRound, game.currentQuestion, buzzerHead.current);
    }
  }, [buzzed]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <LabelOrganizerAnswerController buzzed={buzzed} baseQuestion={baseQuestion} />
      <LabelOrganizerQuestionController />
    </div>
  );
}

function LabelOrganizerAnswerController({ buzzed, baseQuestion }) {
  const game = useGame();

  const gameQuestionRepo = new GameLabellingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <>
      <ButtonGroup
        disableElevation
        variant="contained"
        size="large"
        color="primary"
        // aria-label='outlined primary button group'
      >
        <ValidateAllLabelsButton buzzed={buzzed} gameQuestion={gameQuestion} />
        <CancelLabelButton buzzed={buzzed} />
        <RevealLabelButton buzzed={buzzed} baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
      </ButtonGroup>
    </>
  );
}

function ValidateAllLabelsButton({ buzzed, gameQuestion }) {
  const intl = useIntl();
  const game = useGame();

  const atLeastOneRevealed = gameQuestion.atLeastOneLabelIsRevealed();
  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleValidateAll, isValidating] = useAsyncAction(async () => {
    await validateAllLabels(game.id, game.currentRound, game.currentQuestion, buzzed[0]);
  });

  return (
    <Button
      color="success"
      startIcon={<CheckCircleIcon />}
      onClick={handleValidateAll}
      disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
    >
      {intl.formatMessage(globalMessages.validateAll)}
    </Button>
  );
}

function CancelLabelButton({ buzzed }) {
  const intl = useIntl();
  const game = useGame();

  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleCancelLabel, isCanceling] = useAsyncAction(async () => {
    await cancelPlayer(game.id, game.currentRound, game.currentQuestion, buzzed[0]);
  });

  return (
    <>
      <Button
        color="error"
        startIcon={<CancelIcon />}
        onClick={handleCancelLabel}
        disabled={buzzedIsEmpty || isCanceling}
      >
        {intl.formatMessage(globalMessages.cancel)}
      </Button>
    </>
  );
}

function LabelOrganizerQuestionController({}) {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.LABELLING} />
      <EndQuestionButton questionType={QuestionType.LABELLING} />
      <ClearBuzzerButton questionType={QuestionType.LABELLING} />
    </div>
  );
}
