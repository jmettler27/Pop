'use client';

import { redirect, useParams, useSearchParams } from 'next/navigation';

import { useSession } from 'next-auth/react';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import GameLayout from '@/frontend/components/game/GameLayout';
import GameUnderConstructionScreen from '@/frontend/components/game/GameUnderConstructionScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { GameProvider } from '@/frontend/contexts/GameContext';
import { GameRepositoriesProvider } from '@/frontend/contexts/GameRepositoriesContext';
import { RoleProvider } from '@/frontend/contexts/RoleContext';
import { TeamProvider } from '@/frontend/contexts/TeamContext';
import { UserProvider } from '@/frontend/contexts/UserContext';
import { useGame } from '@/frontend/hooks/firestore/game/useGameHooks';
import { useAllOrganizersOnce } from '@/frontend/hooks/firestore/user/useOrganizerHooks';
import { useAllPlayerIdentitiesOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameStatus } from '@/models/games/game-status';
import { ParticipantRole } from '@/models/users/participant';
import User from '@/models/users/user';

export default function GamePage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const forceSpectator = searchParams.get('spectator') === '1';

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const params = useParams();
  const gameId = params.id as string;
  const repositories = useGameRepositories(gameId);
  const { game, loading: gameLoading, error: gameError } = useGame(repositories?.gameRepo ?? null, gameId);
  const {
    organizers,
    loading: orgLoading,
    error: orgError,
  } = useAllOrganizersOnce(repositories?.organizerRepo ?? null);
  const {
    players,
    loading: playerLoading,
    error: playerError,
  } = useAllPlayerIdentitiesOnce(repositories?.playerRepo ?? null);
  if (!repositories) {
    return <ErrorScreen />;
  }

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

  // Determine user's role and team. forceSpectator bypasses the organizer check so
  // the organizer can view the game in audience/TV mode from this device.
  const role =
    !forceSpectator && organizers?.some((o) => o.id === session.user.id)
      ? ParticipantRole.ORGANIZER
      : players?.find((p) => p.id === session.user.id)
        ? ParticipantRole.PLAYER
        : ParticipantRole.SPECTATOR;

  const teamId =
    role === ParticipantRole.PLAYER ? (players.find((p) => p.id === session.user.id)?.teamId ?? null) : null;

  return (
    <UserProvider user={session.user as User}>
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
