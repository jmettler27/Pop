'use client';

import { SERVER_TIME_OFFSET_REF } from '@/backend/firebase/database';
import {
  EstimationEndView,
  EstimationQuestionHeader,
} from '@/frontend/components/game/main-pane/question/estimation/EstimationCommon';
import Timer from '@/frontend/components/game/timer/Timer';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useRealtimeDatabaseValue } from '@/frontend/hooks/database/useRealtimeDatabaseValue';
import { useTimer } from '@/frontend/hooks/firestore/timer/useTimerHooks';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';

interface EstimationSpectatorPaneProps {
  baseQuestion: EstimationQuestion;
  gameQuestion: GameEstimationQuestion;
}

export default function EstimationSpectatorPane({ baseQuestion, gameQuestion }: EstimationSpectatorPaneProps) {
  const game = useGame();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="shrink-0 w-full flex flex-col items-center justify-center py-3">
        <EstimationQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
        {game!.status === GameStatus.QUESTION_ACTIVE && <EstimationSpectatorActiveView />}
        {game!.status === GameStatus.QUESTION_END && (
          <EstimationEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

function EstimationSpectatorActiveView() {
  const game = useGame();
  const {
    data: serverTimeOffset,
    isLoading: offsetLoading,
    error: offsetError,
  } = useRealtimeDatabaseValue<number>(SERVER_TIME_OFFSET_REF);
  const { timer, timerLoading, timerError } = useTimer(game?.id ?? null);
  if (!game) return null;

  if (
    offsetError ||
    timerError ||
    offsetLoading ||
    timerLoading ||
    serverTimeOffset === null ||
    serverTimeOffset === undefined ||
    !timer
  ) {
    return offsetLoading || timerLoading ? <Spinner /> : <></>;
  }

  return (
    <span className="text-6xl sm:text-7xl lg:text-8xl font-bold tabular-nums">
      ⌛ <Timer timer={timer as never} serverTimeOffset={serverTimeOffset} />
    </span>
  );
}
