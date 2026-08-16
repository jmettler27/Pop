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
import { useScores } from '@/frontend/hooks/firestore/score/useGameScoreHooks';
import { useAllPlayers } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useIsMobile from '@/frontend/hooks/useIsMobile';

// Container components to control re-rendering
const TopPaneContainer = memo(function TopPaneContainer({}) {
  const repos = useGameRepositories();
  const { loading: scoresLoading, error: scoresError } = useScores(repos?.scoreRepo ?? null);
  const { teams, loading: teamsLoading, error: teamsError } = useAllTeams(repos?.teamRepo ?? null);
  const { players, loading: playersLoading, error: playersError } = useAllPlayers(repos?.playerRepo ?? null);
  if (!repos) return <ErrorScreen inline />;

  if (teamsError || scoresError || playersError) return <ErrorScreen inline />;
  if (teamsLoading || scoresLoading || playersLoading) return <LoadingScreen inline />;

  return <TopPane teams={teams} players={players} />;
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
