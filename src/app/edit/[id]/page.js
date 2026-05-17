'use client';

import React from 'react';

import { useIntl } from 'react-intl';

import GameRepository from '@/backend/repositories/game/GameRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import { AddNewRoundButton } from '@/frontend/components/game-editor/AddNewRound';
import { EditGameRoundCard } from '@/frontend/components/game-editor/EditRoundInGame';
import { LaunchGameButton } from '@/frontend/components/game-editor/LaunchGameButton';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import defineMessages from '@/frontend/i18n/defineMessages';
import Game from '@/models/games/Game';
import { GameStatus } from '@/models/games/GameStatus';

const messages = defineMessages('frontend.gameEditor.EditGamePage', {
  expandAll: 'Expand All',
  collapseAll: 'Collapse All',
});

export default function Page({ params }) {
  const resolvedParams = React.use(params);
  const gameId = resolvedParams.id;

  const gameRepo = new GameRepository(gameId);
  const { game, loading, error } = gameRepo.useGame(gameId);

  if (error) return <ErrorScreen />;
  if (loading) return <LoadingScreen />;
  if (!game) return null;

  return <EditGameRounds game={game} />;
}

function EditGameRounds({ game }) {
  const intl = useIntl();

  const { rounds: roundIds, status } = game;
  const [allCollapsed, setAllCollapsed] = React.useState(false);

  const toggleAllCollapse = () => {
    setAllCollapsed(!allCollapsed);
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {status === GameStatus.GAME_EDIT && (
          <>
            <AddNewRoundButton disabled={roundIds.length >= Game.MAX_NUM_ROUNDS} />
            <LaunchGameButton />
          </>
        )}
        <button
          onClick={toggleAllCollapse}
          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          {allCollapsed ? (
            <>
              <ChevronDownIcon className="h-4 w-4" />
              {intl.formatMessage(messages.expandAll)}
            </>
          ) : (
            <>
              <ChevronUpIcon className="h-4 w-4" />
              {intl.formatMessage(messages.collapseAll)}
            </>
          )}
        </button>
      </div>
      <div className="space-y-4">
        {roundIds.map((roundId) => (
          <EditGameRoundCard
            key={roundId}
            roundId={roundId}
            status={status}
            gameId={game.id}
            forceCollapse={allCollapsed}
          />
        ))}
      </div>
    </main>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
