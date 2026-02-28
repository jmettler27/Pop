import {
  handleBuzzerHeadChanged,
  cancelPlayer,
  validateAllQuoteElements,
} from '@/backend/services/question/quote/actions';

import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';

import { isEmpty } from '@/backend/utils/arrays';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext } from '@/frontend/contexts';

import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import ClearQuoteBuzzerButton from '@/frontend/components/game/bottom-pane/question/quote/ClearQuoteBuzzerButton';
import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerHeadPlayer';
import RevealQuoteElementButton from '@/frontend/components/game/bottom-pane/question/quote/RevealQuoteElement';

import { useParams } from 'next/navigation';

import { useEffect, useRef } from 'react';

import { Button, ButtonGroup, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { QuestionType } from '@/backend/models/questions/QuestionType';

const messages = defineMessages('frontend.game.bottom.QuoteOrganizerController', {
  validateAll: 'Validate all',
  cancel: 'Cancel',
});

export default function QuoteOrganizerController({ baseQuestion, questionPlayers }) {
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
      <QuoteOrganizerAnswerController buzzed={buzzed} baseQuestion={baseQuestion} />
      <QuoteOrganizerQuestionController />
    </div>
  );
}

function QuoteOrganizerAnswerController({ buzzed, baseQuestion }) {
  const game = useGameContext();

  const gameQuestionRepo = new GameQuoteQuestionRepository(game.id, game.currentRound);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion);

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
        <ValidateAllQuoteElementsButton buzzed={buzzed} gameQuestion={gameQuestion} />
        <CancelQuoteElementButton buzzed={buzzed} />
        <RevealQuoteElementButton buzzed={buzzed} baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
      </ButtonGroup>
    </>
  );
}

function ValidateAllQuoteElementsButton({ buzzed, gameQuestion }) {
  const intl = useIntl();
  const game = useGameContext();

  const atLeastOneRevealed = gameQuestion.atLeastOneElementRevealed();
  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleValidateAll, isValidating] = useAsyncAction(async () => {
    await validateAllQuoteElements(game.id, game.currentRound, game.currentQuestion, buzzed[0]);
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

function CancelQuoteElementButton({ buzzed }) {
  const intl = useIntl();
  const game = useGameContext();

  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleCancelQuote, isCanceling] = useAsyncAction(async () => {
    await cancelPlayer(game.id, game.currentRound, game.currentQuestion, buzzed[0]);
  });

  return (
    <>
      <Button
        color="error"
        startIcon={<CancelIcon />}
        onClick={handleCancelQuote}
        disabled={buzzedIsEmpty || isCanceling}
      >
        {intl.formatMessage(messages.cancel)}
      </Button>
    </>
  );
}

const CANCEL_QUOTE_ELEMENT = undefined; // removed

function QuoteOrganizerQuestionController({}) {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.QUOTE} />
      <EndQuestionButton questionType={QuestionType.QUOTE} />
      <ClearQuoteBuzzerButton />
    </div>
  );
}
