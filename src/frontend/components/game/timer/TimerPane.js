import { startGame } from '@/backend/services/game/actions';
import { handleQuestionEnd, startRound } from '@/backend/services/round/actions';

import { UserRole } from '@/backend/models/users/User';

import { SERVER_TIME_OFFSET_REF } from '@/backend/firebase/database';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

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
    if (lastExecuted.current && Date.now() - lastExecuted.current <= 1000) {
      console.log('HANDLE TIMER END: RETURN');
      return;
    }
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
        await startRound(game.id, game.currentRound);
        break;
      case GameStatus.QUESTION_ACTIVE:
        // await handleQuestionActiveCountdownEnd(game.id, game.currentRound, game.currentQuestion)
        break;
      case GameStatus.QUESTION_END:
        await handleQuestionEnd(game.id, game.currentRound);
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
      <span className="2xl:text-4xl">
        ⌛ <Timer timer={timer} serverTimeOffset={serverTimeOffset} />
      </span>
    </div>
  );
}

function TimerHeader({ lang = DEFAULT_LOCALE }) {
  const game = useGameContext();

  switch (game.status) {
    case GameStatus.GAME_START:
      return <span className="2xl:text-2xl">{GAME_START_COUNTDOWN_TEXT[lang]}</span>;
    case GameStatus.ROUND_START:
      return <span className="2xl:text-2xl">{ROUND_START_COUNTDOWN_TEXT[lang]}</span>;
    case GameStatus.QUESTION_END:
      return <QuestionEndTimerHeader lang={lang} />;
    default:
      return <></>;
  }
}

// GAME START
const GAME_START_COUNTDOWN_TEXT = {
  en: 'Game starting in',
  'fr-FR': 'Début de la partie dans',
};

// ROUND START
const ROUND_START_COUNTDOWN_TEXT = {
  en: 'First question in',
  'fr-FR': 'Première question dans',
};

// QUESTION END
function QuestionEndTimerHeader({ lang }) {
  const game = useGameContext();

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
    <span className="2xl:text-2xl">
      {isRoundOver ? QUESTION_END_COUNTDOWN_ROUND_END_TEXT[lang] : QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT[lang]}
    </span>
  );
}

const QUESTION_END_COUNTDOWN_ROUND_END_TEXT = {
  en: 'End of round in',
  'fr-FR': 'Fin de manche dans',
};

const QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT = {
  en: 'Next question in',
  'fr-FR': 'Prochaine question dans',
};
