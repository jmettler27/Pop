'use client';

import { UserRole } from '@/backend/models/users/User';
import { GameStatus } from '@/backend/models/games/GameStatus';

import { useGameRepositories } from '@/backend/repositories/useGameRepositories';

import { UserContext, RoleContext, TeamContext, GameContext, GameRepositoriesContext } from '@/frontend/contexts';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameErrorScreen from '@/frontend/components/game/GameErrorScreen';
import GameLayout from '@/frontend/components/game/GameLayout';

import { redirect, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function GamePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const params = useParams();
  const gameId = params.id;
  const repositories = useGameRepositories(gameId);

  const { game, loading: gameLoading, error: gameError } = repositories.gameRepo.useGame(gameId);
  const {
    organizers,
    loading: orgLoading,
    error: orgError,
  } = repositories.organizerRepo.useAllOrganizerIdentitiesOnce();
  const { players, loading: playerLoading, error: playerError } = repositories.playerRepo.useAllPlayerIdentitiesOnce();

  if (gameError || orgError || playerError) return <GameErrorScreen />;
  if (gameLoading || orgLoading || playerLoading) return <LoadingScreen loadingText="Loading game..." />;
  if (!game) return null;

  if (game.status === GameStatus.GAME_EDIT) {
    redirect('/');
  }

  // Determine user's role and team
  const role = organizers?.some((o) => o.id === session.user.id)
    ? UserRole.ORGANIZER
    : players?.find((p) => p.id === session.user.id)
      ? UserRole.PLAYER
      : UserRole.SPECTATOR;

  const teamId = role === UserRole.PLAYER ? players.find((p) => p.id === session.user.id)?.teamId : null;

  return (
    <UserContext.Provider value={session.user}>
      <RoleContext.Provider value={role}>
        <TeamContext.Provider value={teamId}>
          <GameContext.Provider value={game}>
            <GameRepositoriesContext.Provider value={repositories}>
              <GameLayout />
            </GameRepositoriesContext.Provider>
          </GameContext.Provider>
        </TeamContext.Provider>
      </RoleContext.Provider>
    </UserContext.Provider>
  );
}
