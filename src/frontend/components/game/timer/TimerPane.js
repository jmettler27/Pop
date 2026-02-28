import { startGame } from '@/backend/services/game/actions';
import { handleQuestionEnd } from '@/backend/services/round/actions';
import { handleCountdownEnd } from '@/backend/services/question/actions';
import { startRound } from '@/backend/services/round/actions';

import { UserRole } from '@/backend/models/users/User';

import { SERVER_TIME_OFFSET_REF } from '@/backend/firebase/database';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.timer.TimerPane', {
  gameStartsIn: 'Game starting in',
  firstQuestionIn: 'First question in',
  roundEndsIn: 'End of round in',
  nextQuestionIn: 'Next question in',
});

import { useUserContext, useGameContext, useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';

import Timer from '@/frontend/components/game/timer/Timer';
import OrganizerTimerController from '@/frontend/components/game/timer/OrganizerTimerController';
import AuthorizePlayersSwitch from '@/frontend/components/game/bottom-pane/AuthorizePlayersSwitch';

import { useRef } from 'react';

import { useObject } from 'react-firebase-hooks/database';

import { CircularProgress } from '@mui/material';
import { GameStatus } from '@/backend/models/games/GameStatus';

export default function TimerPane() {
  const myRole = useRoleContext();
  return myRole === UserRole.ORGANIZER ? <OrganizerTimerPane /> : <SpectatorTimerPane />;
}

function OrganizerTimerPane() {
  const user = useUserContext();
  const game = useGameContext();
  const { timerRepo } = useGameRepositoriesContext();

  const lastExecuted = useRef(null);

  const handleTimerEnd = async (timer) => {
    console.log('Last executed:', lastExecuted.current?.toLocaleString());

    if (timer.managedBy !== user.id) {
      console.log('HANDLE TIMER END: NOT MANAGED BY ME');
      return;
    }

    console.log('HANDLE TIMER END: EXECUTING');
    lastExecuted.current = Date.now();

    switch (game.status) {
      case GameStatus.GAME_START:
        await startGame(game.id);
        break;
      case GameStatus.ROUND_START:
        await startRound(game.currentQuestionType, game.id, game.currentRound);
        break;
      case GameStatus.QUESTION_ACTIVE:
        await handleCountdownEnd(game.currentQuestionType, game.id, game.currentRound, game.currentQuestion);
        break;
      case GameStatus.QUESTION_END:
        await handleQuestionEnd(game.currentQuestionType, game.id, game.currentRound, game.currentQuestion);
        break;
    }
  };

  const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);

  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (offsetError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(offsetError)}</strong>
      </p>
    );
  }
  if (timerError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(timerError)}</strong>
      </p>
    );
  }
  if (offsetLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!offsetSnapshot || !timer) {
    return <></>;
  }

  const serverTimeOffset = offsetSnapshot.val();

  console.log('TIMER PANE RENDERED:');
  console.log('- Server time offset (MS): ', serverTimeOffset);
  console.log('- Timer:', timer);

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <TimerHeader />
      <OrganizerTimerController
        timer={timer}
        serverTimeOffset={serverTimeOffset}
        onTimerEnd={() => handleTimerEnd(timer)}
      />
      <AuthorizePlayersSwitch authorized={timer.authorized} />
    </div>
  );
}

function SpectatorTimerPane() {
  const { timerRepo } = useGameRepositoriesContext();

  const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (offsetError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(offsetError)}</strong>
      </p>
    );
  }
  if (timerError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(timerError)}</strong>
      </p>
    );
  }
  if (offsetLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!offsetSnapshot || !timer) {
    return <></>;
  }

  const serverTimeOffset = offsetSnapshot.val();

  console.log('SPECTATOR TIMER PANE RENDERED:');
  console.log('- Server time offset (MS): ', serverTimeOffset);
  console.log('- Timer:', timer);

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <TimerHeader />
      <span className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-4xl">
        ⌛ <Timer timer={timer} serverTimeOffset={serverTimeOffset} />
      </span>
    </div>
  );
}

function TimerHeader() {
  const game = useGameContext();
  const intl = useIntl();

  switch (game.status) {
    case GameStatus.GAME_START:
      return (
        <span className="text-xs sm:text-xs lg:text-base 2xl:text-xl">{intl.formatMessage(messages.gameStartsIn)}</span>
      );
    case GameStatus.ROUND_START:
      return (
        <span className="text-xs sm:text-xs lg:text-base 2xl:text-xl">
          {intl.formatMessage(messages.firstQuestionIn)}
        </span>
      );
    case GameStatus.QUESTION_END:
      return <QuestionEndTimerHeader />;
    default:
      return <></>;
  }
}

// GAME START
// ROUND START
// QUESTION END
function QuestionEndTimerHeader() {
  const intl = useIntl();
  const { roundRepo } = useGameRepositoriesContext();
  const { round, roundLoading, roundError } = roundRepo.useRoundOnce(game.currentRound);

  if (roundError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundError)}</strong>
      </p>
    );
  }
  if (roundLoading) {
    return <></>;
  }
  if (!round) {
    return <></>;
  }

  const isRoundOver = round.currentQuestionIdx === round.questions.length - 1;

  return (
    <span className="text-lg sm:text-xl lg:text-2xl 2xl:text-2xl">
      {isRoundOver ? intl.formatMessage(messages.roundEndsIn) : intl.formatMessage(messages.nextQuestionIn)}
    </span>
  );
}
