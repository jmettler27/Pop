import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { isEmpty } from '@/backend/utils/arrays';
import {
  cancelPlayer,
  validateAllLabels,
  handleBuzzerHeadChanged,
} from '@/backend/services/question/labelling/actions';
import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';

import { useGameContext } from '@/frontend/contexts';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import ClearBuzzerButton from '@/frontend/components/game/bottom-pane/question/buzzer/ClearBuzzerButton';
import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerHeadPlayer';
import RevealLabelButton from '@/frontend/components/game/bottom-pane/question/label/RevealLabelButton.js';

import { Button, ButtonGroup, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { QuestionType } from '@/backend/models/questions/QuestionType';

const messages = defineMessages('frontend.game.bottom.LabelOrganizerController', {
  validateAll: 'Validate all',
  cancel: 'Cancel',
});

export default function LabelOrganizerController({ baseQuestion, questionPlayers }) {
  const { id: gameId } = useParams();

  const game = useGameContext();

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
  const game = useGameContext();

  const gameQuestionRepo = new GameLabellingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }
  const revealed = gameQuestion.revealed;

  {
    /* Validate or invalidate the player's answer */
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
  const game = useGameContext();

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
      {intl.formatMessage(messages.validateAll)}
    </Button>
  );
}

function CancelLabelButton({ buzzed }) {
  const intl = useIntl();
  const game = useGameContext();

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
        {intl.formatMessage(messages.cancel)}
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
