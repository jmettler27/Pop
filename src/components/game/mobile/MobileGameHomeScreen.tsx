'use client';

import GameChooserTeamAnnouncement from '@/components/game/chooser/GameChooserTeamAnnouncement';
import GameHomeMiddlePane from '@/components/game/main-pane/game/GameHomeMiddlePane';
import { useIsChooser } from '@/hooks/firestore/user/useChooserHooks';
import useGameId from '@/hooks/useGameId';
import useTeamId from '@/hooks/useTeamId';

export default function MobileGameHomeScreen() {
  const teamId = useTeamId();
  const gameId = useGameId();
  const { isChooser, loading, error } = useIsChooser(gameId, teamId as string);

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
