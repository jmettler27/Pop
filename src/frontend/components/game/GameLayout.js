'use client';

import { memo } from 'react';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';

import TopPane from '@/frontend/components/game/top-pane/TopPane';
import MiddlePane from '@/frontend/components/game/main-pane/MiddlePane';
import BottomPane from '@/frontend/components/game/main-pane/BottomPane';
import Sidebar from '@/frontend/components/game/sidebar/Sidebar';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import ErrorScreen from '@/frontend/components/ErrorScreen';

// Container components to control re-rendering
const TopPaneContainer = memo(function TopPaneContainer({}) {
  console.log('TopPaneContainer');
  const { teamRepo, scoreRepo, playerRepo } = useGameRepositories();

  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();
  const { scores, loading: scoresLoading, error: scoresError } = scoreRepo.useScores();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayers();

  if (teamsError || scoresError || playersError) return <ErrorScreen inline />;
  if (teamsLoading || scoresLoading || playersLoading) return <LoadingScreen inline />;

  return <TopPane teams={teams} players={players} scores={scores} />;
});

const MiddlePaneContainer = memo(function MiddlePaneContainer({}) {
  console.log('MiddlePaneContainer');
  return <MiddlePane />;
});

const BottomPaneContainer = memo(function BottomPaneContainer({}) {
  console.log('BottomPaneContainer');
  return <BottomPane />;
});

const SidebarContainer = memo(function SidebarContainer({}) {
  console.log('SidebarContainer');
  return <Sidebar />;
});

const GameLayout = memo(function GameLayout({}) {
  return (
    <div className="h-screen flex flex-row divide-x divide-dashed bg-slate-900'">
      {/* Main content area */}
      <div className="'h-full w-5/6 flex flex-col divide-y divide-solid">
        {/* Fixed height for top pane */}
        <div className="h-[16.67%] border-b">
          <TopPaneContainer />
        </div>
        {/* Middle pane - main game content */}
        <div className="h-[70%] overflow-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-800 to-slate-900">
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
  );
});

export default GameLayout;
