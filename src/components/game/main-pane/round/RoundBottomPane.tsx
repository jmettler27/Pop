'use client';

import RoundEndBottomPane from '@/components/game/main-pane/round/RoundEndBottomPane';
import RoundStartBottomPane from '@/components/game/main-pane/round/RoundStartBottomPane';
import { Spinner } from '@/components/ui/spinner';
import { useRound } from '@/hooks/firestore/round/useRoundHooks';
import useGame from '@/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';

export default function RoundBottomPane() {
  const game = useGame();
  const currentRound = game?.currentRound ?? '';
  const { round, loading: roundLoading, error: roundError } = useRound(game?.id ?? null, currentRound);

  if (!game) return null;

  if (!currentRound) {
    return <></>;
  }

  if (roundError) {
    return <></>;
  }
  if (roundLoading) {
    return <Spinner />;
  }
  if (!round) {
    return <></>;
  }

  switch (game.status) {
    case GameStatus.ROUND_START:
      return <RoundStartBottomPane />;
    case GameStatus.ROUND_END:
      return <RoundEndBottomPane endedRound={round} />;
    default:
      return null;
  }
}
