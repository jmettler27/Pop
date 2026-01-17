'use client';

import { memo } from 'react';
import { useGameRepositoriesContext } from '@/frontend/contexts';

import TopPane from '@/frontend/components/game/top-pane/TopPane';
import MiddlePane from '@/frontend/components/game/middle-pane/MiddlePane';
import BottomPane from '@/frontend/components/game/bottom-pane/BottomPane';
import Sidebar from '@/frontend/components/game/sidebar/Sidebar';

// Container components to control re-rendering
const TopPaneContainer = memo(function TopPaneContainer({}) {
  console.log('TopPaneContainer');
  const { teamRepo, scoreRepo, playerRepo } = useGameRepositoriesContext();

  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();
  const { scores, loading: scoresLoading, error: scoresError } = scoreRepo.useScores();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayers();

  if (teamsLoading) return <p>Loading teams...</p>;
  if (scoresLoading) return <p>Loading scores...</p>;
  if (playersLoading) return <p>Loading players...</p>;

  if (teamsError)
    return (
      <p>
        <strong>Error loading teams</strong>
      </p>
    );
  if (scoresError)
    return (
      <p>
        <strong>Error loading scores</strong>
      </p>
    );
  if (playersError)
    return (
      <p>
        <strong>Error loading players</strong>
      </p>
    );

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
