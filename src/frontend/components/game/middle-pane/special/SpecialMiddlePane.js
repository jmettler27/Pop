import { SpecialRoundStatus } from '@/backend/models/rounds/Special';

import { useGameContext } from '@/frontend/contexts';
import { useGameRepositoriesContext } from '@/frontend/contexts';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import SpecialHomeMiddlePane from '@/frontend/components/game/middle-pane/special/home/SpecialHomeMiddlePane';
import SpecialThemeMiddlePane from '@/frontend/components/game/middle-pane/special/theme/SpecialThemeMiddlePane';

export default function SpecialMiddlePane({}) {
  const game = useGameContext();

  const { roundRepo } = useGameRepositoriesContext();
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
