import { useCallback, useRef } from 'react';

import { CircularProgress } from '@mui/material';
import { useObject } from 'react-firebase-hooks/database';
import { useIntl } from 'react-intl';

import { SERVER_TIME_OFFSET_REF } from '@/backend/firebase/database';
import { startGame } from '@/backend/services/game/actions';
import { handleCountdownEnd } from '@/backend/services/question/actions';
import { handleQuestionEnd, startRound } from '@/backend/services/round/actions';
import AuthorizePlayersSwitch from '@/frontend/components/game/main-pane/AuthorizePlayersSwitch';
import OrganizerTimerController from '@/frontend/components/game/timer/OrganizerTimerController';
import Timer from '@/frontend/components/game/timer/Timer';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameStatus } from '@/models/games/GameStatus';
import { ParticipantRole } from '@/models/users/Participant';

const messages = defineMessages('frontend.game.timer.TimerPane', {
  gameStartsIn: 'Game starting in',
  firstQuestionIn: 'First question in',
  roundEndsIn: 'End of round in',
  nextQuestionIn: 'Next question in',
});

export default function TimerPane() {
  const myRole = useRole();
  return myRole === ParticipantRole.ORGANIZER ? <OrganizerTimerPane /> : <SpectatorTimerPane />;
}

function OrganizerTimerPane() {
  const user = useUser();
  const game = useGame();
  const { timerRepo } = useGameRepositories();

  const isExecutingRef = useRef(false);

  const handleTimerEnd = useCallback(async () => {
    // Prevent concurrent executions
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    try {
      // Capture current game state at the time of the call
      const currentStatus = game.status;
      const currentGameId = game.id;
      const currentQuestionType = game.currentQuestionType;
      const currentRound = game.currentRound;
      const currentQuestion = game.currentQuestion;

      switch (currentStatus) {
        case GameStatus.GAME_START:
          await startGame(currentGameId);
          break;
        case GameStatus.ROUND_START:
          await startRound(currentQuestionType, currentGameId, currentRound);
          break;
        case GameStatus.QUESTION_ACTIVE:
          await handleCountdownEnd(currentQuestionType, currentGameId, currentRound, currentQuestion);
          break;
        case GameStatus.QUESTION_END:
          await handleQuestionEnd(currentQuestionType, currentGameId, currentRound, currentQuestion);
          break;
      }
    } finally {
      isExecutingRef.current = false;
    }
  }, [game.status, game.id, game.currentQuestionType, game.currentRound, game.currentQuestion]);

  const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);

  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (offsetError || timerError) {
    return <></>;
  }
  if (offsetLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!offsetSnapshot || !timer) {
    return <></>;
  }

  const serverTimeOffset = offsetSnapshot.val();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <TimerHeader />
      <OrganizerTimerController timer={timer} serverTimeOffset={serverTimeOffset} onTimerEnd={handleTimerEnd} />
      <AuthorizePlayersSwitch authorized={timer.authorized} />
    </div>
  );
}

function SpectatorTimerPane() {
  const { timerRepo } = useGameRepositories();

  const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (offsetError || timerError) {
    return <></>;
  }
  if (offsetLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!offsetSnapshot || !timer) {
    return <></>;
  }

  const serverTimeOffset = offsetSnapshot.val();

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
  const game = useGame();
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
  const game = useGame();

  const { roundRepo } = useGameRepositories();
  const { round, roundLoading, roundError } = roundRepo.useRoundOnce(game.currentRound);

  if (roundError) {
    return <></>;
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
