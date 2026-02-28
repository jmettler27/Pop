import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import { SpecialRoundStatus } from '@/backend/models/rounds/Special';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameChooserTeamAnnouncement from '@/frontend/components/game/GameChooserTeamAnnouncement';
import GameChooserOrder from '@/frontend/components/game/GameChooserOrder';
import SpecialThemeBottomPane from '@/frontend/components/game/bottom-pane/special/SpecialThemeBottomPane';

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
  const game = useGameContext();

  const { roundRepo } = useGameRepositoriesContext();
  const { round, loading, error } = roundRepo.useRound(game.currentRound);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <LoadingScreen loadingText="Loading round info..." />;
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
  const game = useGameContext();

  const { chooserRepo } = useGameRepositoriesContext();
  const { chooser, loading, error } = chooserRepo.useChooser(game.id);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!chooser) {
    return <></>;
  }

  return <GameChooserOrder chooser={chooser} />;
}
