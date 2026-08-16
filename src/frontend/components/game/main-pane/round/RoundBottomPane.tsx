'use client';

import RoundEndBottomPane from '@/frontend/components/game/main-pane/round/RoundEndBottomPane';
import RoundStartBottomPane from '@/frontend/components/game/main-pane/round/RoundStartBottomPane';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useRound } from '@/frontend/hooks/firestore/round/useRoundHooks';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameStatus } from '@/models/games/game-status';

export default function RoundBottomPane() {
  const game = useGame();
  const gameRepositories = useGameRepositories();
  const currentRound = (game?.currentRound as string | undefined) ?? '';
  const {
    round,
    loading: roundLoading,
    error: roundError,
  } = useRound(gameRepositories?.roundRepo ?? null, currentRound);

  if (!game) return null;
  if (!gameRepositories) return null;

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
