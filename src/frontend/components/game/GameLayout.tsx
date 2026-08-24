'use client';

import { memo } from 'react';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import BackgroundContainer from '@/frontend/components/game/BackgroundContainer';
import BottomPane from '@/frontend/components/game/main-pane/BottomPane';
import MiddlePane from '@/frontend/components/game/main-pane/MiddlePane';
import MobilePlayerLayout from '@/frontend/components/game/MobilePlayerLayout';
import Sidebar from '@/frontend/components/game/sidebar/Sidebar';
import TopPane from '@/frontend/components/game/top-pane/TopPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useCurrentTeamScores } from '@/frontend/hooks/firestore/score/useCurrentTeamScores';
import { useAllPlayers } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';
import useIsMobile from '@/frontend/hooks/useIsMobile';

// Container components to control re-rendering
const TopPaneContainer = memo(function TopPaneContainer({}) {
  const game = useGame();
  // Resolved once here (which score map applies right now) and handed down as a prop, instead of every
  // team independently re-deriving and re-fetching the same policy decision — see useCurrentTeamScores.
  // Its own loading state stays local to the score display (below) rather than blocking the whole pane,
  // matching the original per-team behavior.
  const { scores, loading: scoresLoading } = useCurrentTeamScores(game);
  const { teams, loading: teamsLoading, error: teamsError } = useAllTeams(game?.id ?? null);
  const { players, loading: playersLoading, error: playersError } = useAllPlayers(game?.id ?? null);

  if (teamsError || playersError) return <ErrorScreen inline />;
  if (teamsLoading || playersLoading) return <LoadingScreen inline />;

  return <TopPane teams={teams} players={players} scores={scores} scoresLoading={scoresLoading} />;
});

const MiddlePaneContainer = memo(function MiddlePaneContainer({}) {
  return <MiddlePane />;
});

const BottomPaneContainer = memo(function BottomPaneContainer({}) {
  return <BottomPane />;
});

const SidebarContainer = memo(function SidebarContainer({}) {
  return <Sidebar />;
});

const GameLayout = memo(function GameLayout({}) {
  const isMobile = useIsMobile();

  if (isMobile === null) return null;
  if (isMobile) return <MobilePlayerLayout />;

  return (
    <div className="h-screen relative">
      <BackgroundContainer />
      <div className="h-full flex flex-row divide-x divide-dashed">
        {/* Main content area */}
        <div className="h-full w-5/6 flex flex-col divide-y divide-solid">
          {/* Fixed height for top pane */}
          <div className="h-[16.67%] border-b">
            <TopPaneContainer />
          </div>
          {/* Middle pane - main game content */}
          <div className="h-[70%] overflow-auto">
            <MiddlePaneContainer />
          </div>
          {/* Bottom pane - controls and timer */}
          <div className="h-[13.33%] border-t">
            <BottomPaneContainer />
          </div>
        </div>
        {/* Fixed width for sidebar */}
        <div className="h-full w-1/6 flex flex-col">
          <SidebarContainer />
        </div>
      </div>
    </div>
  );
});

export default GameLayout;
