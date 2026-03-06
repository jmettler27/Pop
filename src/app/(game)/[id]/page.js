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
