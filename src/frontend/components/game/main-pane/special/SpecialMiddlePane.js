import { SpecialRoundStatus } from '@/backend/models/rounds/Special';

import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import SpecialHomeMiddlePane from '@/frontend/components/game/main-pane/special/home/SpecialHomeMiddlePane';
import SpecialThemeMiddlePane from '@/frontend/components/game/main-pane/special/theme/SpecialThemeMiddlePane';

export default function SpecialMiddlePane({}) {
  const game = useGame();

  const { roundRepo } = useGameRepositories();
  const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound);

  if (roundError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundError)}</strong>
      </p>
    );
  }
  if (roundLoading) {
    return <LoadingScreen loadingText="Loading round..." />;
  }
  if (!round) {
    return <></>;
  }

  switch (round.status) {
    case SpecialRoundStatus.HOME:
      return <SpecialHomeMiddlePane round={round} />;
    case SpecialRoundStatus.THEME_ACTIVE:
    case SpecialRoundStatus.THEME_END:
      return <SpecialThemeMiddlePane round={round} />;
  }
}
