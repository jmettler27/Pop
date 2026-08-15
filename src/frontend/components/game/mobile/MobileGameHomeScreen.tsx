'use client';

import GameChooserTeamAnnouncement from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import GameHomeMiddlePane from '@/frontend/components/game/main-pane/game/GameHomeMiddlePane';
import { useIsChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';

export default function MobileGameHomeScreen() {
  const myTeam = useTeam();
  const game = useGame();
  const { isChooser, loading, error } = useIsChooser(game?.id ?? null, myTeam as string);
  if (!game) return null;

  if (error || loading || isChooser === null) return null;

  if (isChooser) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <GameHomeMiddlePane />
        </div>
        <div className="shrink-0 flex items-center justify-center p-4 text-xl font-bold text-white">
          <GameChooserTeamAnnouncement />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-6 text-center">
      <span className="text-xl font-bold text-white">
        <GameChooserTeamAnnouncement />
      </span>
    </div>
  );
}
