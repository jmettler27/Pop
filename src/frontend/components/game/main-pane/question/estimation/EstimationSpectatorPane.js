'use client';

import { CircularProgress } from '@mui/material';
import { useObject } from 'react-firebase-hooks/database';

import { SERVER_TIME_OFFSET_REF } from '@/backend/firebase/database';
import Timer from '@/frontend/components/game/timer/Timer';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameStatus } from '@/models/games/GameStatus';

import { EstimationEndView, EstimationQuestionHeader } from './EstimationCommon';

export default function EstimationSpectatorPane({ baseQuestion, gameQuestion }) {
  const game = useGame();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <EstimationQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {game.status === GameStatus.QUESTION_ACTIVE && <EstimationSpectatorActiveView />}
        {game.status === GameStatus.QUESTION_END && (
          <EstimationEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

function EstimationSpectatorActiveView() {
  const { timerRepo } = useGameRepositories();
  const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (offsetError || timerError || offsetLoading || timerLoading || !offsetSnapshot || !timer) {
    return offsetLoading || timerLoading ? <CircularProgress /> : <></>;
  }

  return (
    <span className="text-6xl sm:text-7xl lg:text-8xl font-bold tabular-nums">
      ⌛ <Timer timer={timer} serverTimeOffset={offsetSnapshot.val()} />
    </span>
  );
}
