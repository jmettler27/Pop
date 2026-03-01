import { addPlayerToBuzzer, removePlayerFromBuzzer } from '@/backend/services/question/basic/actions';

import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';

import { PlayerStatus } from '@/backend/models/users/Player';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import { useUserContext, useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { Button, IconButton, Tooltip } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import PanToolIcon from '@mui/icons-material/PanTool';

import clsx from 'clsx';

const messages = defineMessages('frontend.game.BasicPlayerController', {
  oneMoreWaitingClue: 'at the next clue',
  maxTriesExceeded: 'You have exceeded the maximum number of tries!',
  canceledWarning: 'You will be able to buzz again',
  lastAttempt: "Attention, it's your last attempt.",
  waitingForTurn: 'Wait for your turn...',
  idle: 'Any idea?',
  firstBuzzer: "We're all ears",
  incorrectAnswer: 'Wrong answer!',
});

export default function BasicPlayerController({ players: basicPlayers }) {
  const game = useGameContext();
  const user = useUserContext();

  const { playerRepo, roundRepo } = useGameRepositoriesContext();
  const gameQuestionRepo = new GameBasicQuestionRepository(game.id, game.currentRound);

  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayer(user.id);
  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (playerError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(playerError)}
      </p>
    );
  }
  if (roundError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(roundError)}
      </p>
    );
  }
  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(gameQuestionError)}
      </p>
    );
  }
  if (playerLoading || roundLoading || gameQuestionLoading) {
    return <></>;
  }
  if (!player || !round || !gameQuestion) {
    return <></>;
  }

  const { buzzed, canceled } = basicPlayers;

  const hasBuzzed = buzzed.includes(user.id);
  const isFirst = hasBuzzed && buzzed[0] === user.id;

  const myCanceledItems = canceled.filter((item) => item.playerId === user.id);
  const hasExceededMaxTries = myCanceledItems && myCanceledItems.length >= round.maxTries;

  return (
    <div className="flex flex-col h-full items-center justify-around">
      <BuzzerMessage
        playerStatus={player.status}
        hasExceededMaxTries={hasExceededMaxTries}
        round={round}
        myCanceledItems={myCanceledItems}
        isFirst={isFirst}
        hasBuzzed={hasBuzzed}
        remaining={remaining}
      />
      <div className="flex flex-row w-full justify-center">
        <BuzzerButton isDisabled={hasBuzzed || hasExceededMaxTries} />
        <BuzzerResetButton isDisabled={!hasBuzzed || hasExceededMaxTries} />
      </div>
    </div>
  );
}

function BuzzerMessage({ playerStatus, hasExceededMaxTries, round, myCanceledItems, isFirst, hasBuzzed, remaining }) {
  const intl = useIntl();
  if (hasExceededMaxTries)
    return (
      <span className="2xl:text-3xl text-red-500">
        🤐 {intl.formatMessage(messages.maxTriesExceeded)} ({round.maxTries})
      </span>
    );

  if (playerStatus === PlayerStatus.WRONG) {
    const message = intl.formatMessage(messages.incorrectAnswer);
    if (round.type === QuestionType.PROGRESSIVE_CLUES && round.delay && round.delay > 0) {
      return (
        <span className="2xl:text-3xl">
          {message} {intl.formatMessage(messages.canceledWarning)}{' '}
          <span className="font-bold text-blue-500">
            {remaining > 1
              ? numRemainingClues(remaining, intl.locale)
              : intl.formatMessage(messages.oneMoreWaitingClue)}
            .
          </span>
        </span>
      );
    }
    return <span className="2xl:text-3xl text-red-500">{message}</span>;
  }
  if (isFirst) {
    const message = `${intl.formatMessage(messages.firstBuzzer)} 🧐`;
    if (myCanceledItems.length === round.maxTries - 1)
      return (
        <span className="2xl:text-3xl">
          {message}. <span className="text-red-500">{intl.formatMessage(messages.lastAttempt)}</span>
        </span>
      );
    return <span className="2xl:text-3xl">{message}</span>;
  }
  if (hasBuzzed) return <span className="2xl:text-3xl">{intl.formatMessage(messages.waitingForTurn)}</span>;
  return <span className="2xl:text-3xl">{intl.formatMessage(messages.idle)} 🤔</span>;
}

function BuzzerButton({ isDisabled }) {
  const game = useGameContext();
  const user = useUserContext();

  const [handleBuzz, isBuzzing] = useAsyncAction(async () => {
    await addPlayerToBuzzer(game.id, game.currentRound, game.currentQuestion, user.id);
  });

  return (
    <Button
      size="large"
      variant="contained"
      color="primary"
      onClick={handleBuzz}
      disabled={isDisabled || isBuzzing}
      style={{ backgroundColor: isDisabled ? 'gray' : 'red' }}
      endIcon={<PanToolIcon />}
    >
      <span className={clsx('2xl:text-3xl', !isDisabled && 'text-slate-100')}>BUZZ</span>
    </Button>
  );
}

function BuzzerResetButton({ isDisabled }) {
  const game = useGameContext();
  const user = useUserContext();

  const [handleResetBuzz, isResetting] = useAsyncAction(async () => {
    await removePlayerFromBuzzer(game.id, game.currentRound, game.currentQuestion, user.id);
  });

  return (
    <Tooltip title="Annuler" placement="right">
      <span>
        <IconButton
          color="primary"
          aria-label="reset buzzer"
          onClick={handleResetBuzz}
          disabled={isDisabled || isResetting}
        >
          <ReplayIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
