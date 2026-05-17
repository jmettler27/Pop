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
import Timer, { type TimerData } from '@/frontend/components/game/timer/Timer';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { type QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

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
  useUser();
  const game = useGame();
  const gameRepositories = useGameRepositories()!;
  const { timerRepo } = gameRepositories;

  const isExecutingRef = useRef(false);

  const handleTimerEnd = useCallback(async () => {
    if (!game) return;
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    try {
      const currentStatus = game.status;
      const currentGameId = game.id as string;
      const currentQuestionType = game.currentQuestionType as string;
      const currentRound = game.currentRound as string;
      const currentQuestion = game.currentQuestion as string;

      switch (currentStatus) {
        case GameStatus.GAME_START:
          await startGame(currentGameId);
          break;
        case GameStatus.ROUND_START:
          await startRound(currentQuestionType as QuestionType, currentGameId, currentRound);
          break;
        case GameStatus.QUESTION_ACTIVE:
          await handleCountdownEnd(currentQuestionType as QuestionType, currentGameId, currentRound, currentQuestion);
          break;
        case GameStatus.QUESTION_END:
          await handleQuestionEnd(currentQuestionType, currentGameId, currentRound, currentQuestion);
          break;
      }
    } finally {
      isExecutingRef.current = false;
    }
  }, [game]);

  const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (!game) return null;

  if (offsetError || timerError) {
    return <></>;
  }
  if (offsetLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!offsetSnapshot || !timer) {
    return <></>;
  }

  const serverTimeOffset = offsetSnapshot.val() as number;
  const timerData = timer as unknown as TimerData;

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <TimerHeader />
      <OrganizerTimerController timer={timerData} serverTimeOffset={serverTimeOffset} onTimerEnd={handleTimerEnd} />
      <AuthorizePlayersSwitch authorized={timerData.authorized ?? false} />
    </div>
  );
}

function SpectatorTimerPane() {
  const gameRepositories = useGameRepositories()!;
  const { timerRepo } = gameRepositories;

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

  const serverTimeOffset = offsetSnapshot.val() as number;

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
  const gameRepositories = useGameRepositories()!;
  const { roundRepo } = gameRepositories;
  const currentRound = game?.currentRound ?? '';
  const { round, loading: roundLoading, error: roundError } = roundRepo.useRoundOnce(currentRound);

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
