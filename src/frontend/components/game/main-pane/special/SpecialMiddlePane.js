import ErrorScreen from '@/frontend/components/ErrorScreen';
import SpecialHomeMiddlePane from '@/frontend/components/game/main-pane/special/home/SpecialHomeMiddlePane';
import SpecialThemeMiddlePane from '@/frontend/components/game/main-pane/special/theme/SpecialThemeMiddlePane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { SpecialRoundStatus } from '@/models/rounds/Special';

export default function SpecialMiddlePane({}) {
  const game = useGame();

  const { roundRepo } = useGameRepositories();
  const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound);

  if (roundError) {
    return <ErrorScreen inline />;
  }
  if (roundLoading) {
    return <LoadingScreen inline />;
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
