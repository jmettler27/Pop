'use client';

import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import { useQuestionPlayers } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useGame from '@/frontend/hooks/useGame';

export default function MobileBuzzerControl() {
  const game = useGame();

  const {
    data: questionPlayers,
    loading,
    error,
  } = useQuestionPlayers(game?.id ?? null, game?.currentRound ?? null, game?.currentQuestion as string);

  if (!game) return null;
  if (error || loading || !questionPlayers) return null;

  return (
    <div className="flex items-center justify-center h-full p-4">
      <BuzzerPlayerController questionPlayers={questionPlayers} compact />
    </div>
  );
}
