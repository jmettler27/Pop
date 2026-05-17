'use client';

import { CircularProgress } from '@mui/material';

import RoundEndBottomPane from '@/frontend/components/game/main-pane/round/RoundEndBottomPane';
import RoundStartBottomPane from '@/frontend/components/game/main-pane/round/RoundStartBottomPane';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';

export default function RoundBottomPane() {
  const game = useGame();
  if (!game) return null;

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { roundRepo } = gameRepositories;

  const currentRound = game.currentRound as string;
  console.log('Current round', currentRound);

  if (!currentRound) {
    return <></>;
  }

  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(currentRound);

  if (roundError) {
    return <></>;
  }
  if (roundLoading) {
    return <CircularProgress />;
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
