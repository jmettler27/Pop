import { useCallback, useRef } from 'react';

import { useIntl } from 'react-intl';

import { GAME_ACTIONS, QUESTION_ACTIONS, questionAction, ROUND_ACTIONS, updateGame, updateRound } from '@/api';
import AuthorizePlayersSwitch from '@/components/game/main-pane/AuthorizePlayersSwitch';
import OrganizerTimerController from '@/components/game/timer/OrganizerTimerController';
import Timer, { type TimerData } from '@/components/game/timer/Timer';
import { Spinner } from '@/components/ui/spinner';
import { SERVER_TIME_OFFSET_REF } from '@/firebase/database';
import { useRealtimeDatabaseValue } from '@/hooks/database/useRealtimeDatabaseValue';
import { useRoundOnce } from '@/hooks/firestore/round/useRoundHooks';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import useGame from '@/hooks/useGame';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
import useUser from '@/hooks/useUser';
import defineMessages from '@/i18n/defineMessages';
import { GameStatus } from '@/models/games/game-status';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.timer.TimerPane', {
  gameStartsIn: 'Game starting in',
  firstQuestionIn: 'First question in',
  roundEndsIn: 'End of round in',
  nextQuestionIn: 'Next question in',
});

export default function TimerPane() {
  const role = useRole();
  return role === ParticipantRole.ORGANIZER ? <OrganizerTimerPane /> : <SpectatorTimerPane />;
}

function OrganizerTimerPane() {
  useUser();
  const game = useGame();

  const isExecutingRef = useRef(false);

  const handleTimerEnd = useCallback(async () => {
    if (!game) return;
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    try {
      const currentStatus = game.status;
      const currentGameId = game.id as string;
      const currentRound = game.currentRound as string;
      const currentQuestion = game.currentQuestion as string;

      switch (currentStatus) {
        case GameStatus.GAME_START:
          await updateGame(currentGameId, { action: GAME_ACTIONS.Start });
          break;
        case GameStatus.ROUND_START:
          await updateRound(currentGameId, currentRound, { action: ROUND_ACTIONS.Start });
          break;
        case GameStatus.QUESTION_ACTIVE:
          await questionAction(currentGameId, currentRound, currentQuestion, {
            action: QUESTION_ACTIONS.QuestionCountdownEnd,
          });
          break;
        case GameStatus.QUESTION_END:
          await updateRound(currentGameId, currentRound, {
            action: ROUND_ACTIONS.EndQuestion,
            questionId: currentQuestion,
          });
          break;
      }
    } finally {
      isExecutingRef.current = false;
    }
  }, [game]);

  const {
    data: serverTimeOffset,
    isLoading: offsetLoading,
    error: offsetError,
  } = useRealtimeDatabaseValue<number>(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = useTimer(game?.id ?? null);

  if (!game) return null;

  if (offsetError || timerError) {
    return <></>;
  }
  if (offsetLoading || timerLoading) {
    return <Spinner />;
  }
  if (serverTimeOffset === null || serverTimeOffset === undefined || !timer) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <TimerHeader />
      <OrganizerTimerController
        timer={timer as unknown as TimerData}
        serverTimeOffset={serverTimeOffset}
        onTimerEnd={handleTimerEnd}
      />
      <AuthorizePlayersSwitch authorized={timer.authorized ?? false} />
    </div>
  );
}

function SpectatorTimerPane() {
  const gameId = useGameId();

  const {
    data: serverTimeOffset,
    isLoading: offsetLoading,
    error: offsetError,
  } = useRealtimeDatabaseValue<number>(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = useTimer(gameId);

  if (offsetError || timerError) {
    return <></>;
  }
  if (offsetLoading || timerLoading) {
    return <Spinner />;
  }
  if (serverTimeOffset === null || serverTimeOffset === undefined || !timer) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <TimerHeader />
      <span className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-4xl">
        ⌛ <Timer timer={timer as unknown as TimerData} serverTimeOffset={serverTimeOffset} />
      </span>
    </div>
  );
}

function TimerHeader() {
  const game = useGame();
  const intl = useIntl();

  if (!game) return null;

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

function QuestionEndTimerHeader() {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game?.currentRound ?? '';
  const { round, loading: roundLoading, error: roundError } = useRoundOnce(game?.id ?? null, currentRound);

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
