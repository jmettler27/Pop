'use client';

import BuzzerPlayerController from '@/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import { useQuestionPlayers } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';

export default function MobileBuzzerControl() {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { data: questionPlayers, loading, error } = useQuestionPlayers(gameId, roundId, questionId);

  if (error || loading || !questionPlayers) return null;

  return (
    <div className="flex items-center justify-center h-full p-4">
      <BuzzerPlayerController questionPlayers={questionPlayers} compact />
    </div>
  );
}
