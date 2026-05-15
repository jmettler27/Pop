import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import GameChooserTeamAnnouncement from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import SpecialThemeBottomPane from '@/frontend/components/game/main-pane/special/SpecialThemeBottomPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { SpecialRoundStatus } from '@/models/rounds/Special';

export default function SpecialBottomPane() {
  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4 flex flex-col items-center justify-center">
        <SpecialController />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <SpecialChooserOrder />
      </div>
    </div>
  );
}

function SpecialController() {
  const game = useGame();

  const { roundRepo } = useGameRepositories();
  const { round, loading, error } = roundRepo.useRound(game.currentRound);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!round) {
    return <></>;
  }

  switch (round.status) {
    case SpecialRoundStatus.HOME:
      return (
        <span className="2xl:text-4xl font-bold">
          <GameChooserTeamAnnouncement />
        </span>
      );
    case SpecialRoundStatus.ACTIVE:
    case SpecialRoundStatus.END:
      return <SpecialThemeBottomPane round={round} />;
  }
}

function SpecialChooserOrder() {
  const game = useGame();

  const { chooserRepo } = useGameRepositories();
  const { chooser, loading, error } = chooserRepo.useChooser(game.id);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <></>;
  }
  if (!chooser) {
    return <></>;
  }

  return <GameChooserOrder chooser={chooser} />;
}
