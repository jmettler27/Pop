'use client';

import { ParticipantRole } from '@/backend/models/users/Participant';
import { GameStatus } from '@/backend/models/games/GameStatus';

import useGameRepositories from '@/frontend/hooks/useGameRepositories';

import { UserProvider } from '@/frontend/contexts/UserContext';
import { RoleProvider } from '@/frontend/contexts/RoleContext';
import { TeamProvider } from '@/frontend/contexts/TeamContext';
import { GameProvider } from '@/frontend/contexts/GameContext';
import { GameRepositoriesProvider } from '@/frontend/contexts/GameRepositoriesContext';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import GameLayout from '@/frontend/components/game/GameLayout';
import GameUnderConstructionScreen from '@/frontend/components/game/GameUnderConstructionScreen';

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

  const { gameRepo, organizerRepo, playerRepo } = repositories;

  const { game, loading: gameLoading, error: gameError } = gameRepo.useGame(gameId);
  const { organizers, loading: orgLoading, error: orgError } = organizerRepo.useAllOrganizerIdentitiesOnce();
  const { players, loading: playerLoading, error: playerError } = playerRepo.useAllPlayerIdentitiesOnce();

  if (gameError || orgError || playerError) {
    return <ErrorScreen />;
  }
  if (gameLoading || orgLoading || playerLoading) {
    return <LoadingScreen />;
  }
  if (!game) return null;

  if (game.status === GameStatus.GAME_EDIT) {
    return <GameUnderConstructionScreen />;
  }

  // Determine user's role and team
  const role = organizers?.some((o) => o.id === session.user.id)
    ? ParticipantRole.ORGANIZER
    : players?.find((p) => p.id === session.user.id)
      ? ParticipantRole.PLAYER
      : ParticipantRole.SPECTATOR;

  const teamId = role === ParticipantRole.PLAYER ? players.find((p) => p.id === session.user.id)?.teamId : null;

  return (
    <UserProvider user={session.user}>
      <RoleProvider role={role}>
        <TeamProvider teamId={teamId}>
          <GameProvider game={game}>
            <GameRepositoriesProvider repositories={repositories}>
              <GameLayout />
            </GameRepositoriesProvider>
          </GameProvider>
        </TeamProvider>
      </RoleProvider>
    </UserProvider>
  );
}
