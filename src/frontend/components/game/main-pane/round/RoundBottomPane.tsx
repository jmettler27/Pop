'use client';

import RoundEndBottomPane from '@/frontend/components/game/main-pane/round/RoundEndBottomPane';
import RoundStartBottomPane from '@/frontend/components/game/main-pane/round/RoundStartBottomPane';
import { Spinner } from '@/frontend/components/ui/spinner';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameStatus } from '@/models/games/game-status';

export default function RoundBottomPane() {
  const game = useGame();
  const gameRepositories = useGameRepositories();

  if (!game) return null;
  if (!gameRepositories) return null;
  const { roundRepo } = gameRepositories;

  const currentRound = game.currentRound as string;

  if (!currentRound) {
    return <></>;
  }

  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(currentRound);

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
