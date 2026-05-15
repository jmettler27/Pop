import { CircularProgress } from '@mui/material';

import RoundEndBottomPane from '@/frontend/components/game/main-pane/round/RoundEndBottomPane';
import RoundStartBottomPane from '@/frontend/components/game/main-pane/round/RoundStartBottomPane';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameStatus } from '@/models/games/GameStatus';

export default function RoundBottomPane() {
  const game = useGame();
  console.log('game', game);

  const { roundRepo } = useGameRepositories();
  console.log('Current round', game.currentRound);

  if (!game.currentRound) {
    return <></>;
  }

  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound);

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
  }
}
