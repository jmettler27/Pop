import { handleBuzzerHeadChanged, invalidateAnswer, validateAnswer } from '@/backend/services/question/buzzer/actions';
import { revealClue } from '@/backend/services/question/progressive-clues/actions';

import { QuestionType } from '@/backend/models/questions/QuestionType';

import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/GameProgressiveCluesQuestionRepository';

import { useGameContext } from '@/frontend/contexts';

import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import ClearBuzzerButton from '@/frontend/components/game/bottom-pane/question/buzzer/ClearBuzzerButton';
import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerHeadPlayer';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { Button, ButtonGroup } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { useParams } from 'next/navigation';

import { useEffect, useRef } from 'react';

const messages = defineMessages('frontend.game.bottom.BuzzerOrganizerController', {
  validate: 'Validate',
  invalidate: 'Invalidate',
  nextClue: 'Next clue',
});

export default function BuzzerOrganizerController({ baseQuestion, questionPlayers: questionPlayers }) {
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
      // const handleBuzzerHeadChangedAction = getHandleBuzzerHeadChangedAction();
      // handleBuzzerHeadChangedAction(gameId, game.currentRound, game.currentQuestion, buzzerHead.current);
      if (baseQuestion.type !== QuestionType.QUOTE) {
        handleBuzzerHeadChanged(baseQuestion.type, gameId, game.currentRound, game.currentQuestion, buzzerHead.current);
      } else {
        handleQuoteBuzzerHeadChanged(gameId, game.currentRound, game.currentQuestion, buzzerHead.current);
      }
    }
  }, [buzzed]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <BuzzerOrganizerAnswerController buzzed={buzzed} questionType={baseQuestion.type} />
      <BuzzerOrganizerQuestionController baseQuestion={baseQuestion} />
    </div>
  );
}

function BuzzerOrganizerAnswerController({ buzzed, questionType }) {
  const intl = useIntl();
  const game = useGameContext();

  const buzzedIsEmpty = buzzed.length === 0;

  const [handleValidate, isValidating] = useAsyncAction(async () => {
    console.log('HANDLE VALIDATE');
    await validateAnswer(game.currentQuestionType, game.id, game.currentRound, game.currentQuestion, buzzed[0]);
  });

  const [handleInvalidate, isInvalidating] = useAsyncAction(async () => {
    await invalidateAnswer(game.currentQuestionType, game.id, game.currentRound, game.currentQuestion, buzzed[0]);
  });

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
        disabled={buzzedIsEmpty}
      >
        {/* Validate the player's answer */}
        <Button color="success" startIcon={<CheckCircleIcon />} onClick={handleValidate} disabled={isValidating}>
          {intl.formatMessage(messages.validate)}
        </Button>

        {/* Invalidate the player's answer */}
        <Button color="error" startIcon={<CancelIcon />} onClick={handleInvalidate} disabled={isInvalidating}>
          {intl.formatMessage(messages.invalidate)}
        </Button>
      </ButtonGroup>
    </>
  );
}

function BuzzerOrganizerQuestionController({ baseQuestion }) {
  return (
    <div className="flex flex-row w-full justify-end">
      {/* Next clue */}
      {baseQuestion.type === QuestionType.PROGRESSIVE_CLUES && <NextClueButton baseQuestion={baseQuestion} />}
      <ResetQuestionButton questionType={baseQuestion.type} />
      <EndQuestionButton questionType={baseQuestion.type} />
      <ClearBuzzerButton questionType={baseQuestion.type} />
    </div>
  );
}

/**
 * Go to the next clue
 *
 * @param {*} question
 * @returns
 */
function NextClueButton({ baseQuestion }) {
  const intl = useIntl();
  const game = useGameContext();

  const [handleClick, isLoadingNextClue] = useAsyncAction(async () => {
    await revealClue(game.id, game.currentRound, game.currentQuestion);
  });

  const gameQuestionRepo = new GameProgressiveCluesQuestionRepository(game.id, game.currentRound);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(gameQuestionError)}
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <></>;
  }
  if (!gameQuestion) {
    return <></>;
  }
  const isLastClue = gameQuestion.currentClueIdx >= baseQuestion.clues.length - 1;

  return (
    <Button
      variant="contained"
      size="large"
      onClick={handleClick}
      disabled={isLastClue || isLoadingNextClue}
      startIcon={<ArrowDownwardIcon />}
    >
      {intl.formatMessage(messages.nextClue)}
    </Button>
  );
}
