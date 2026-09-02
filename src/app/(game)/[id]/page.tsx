'use client';

import { redirect, useSearchParams } from 'next/navigation';

import { useSession } from 'next-auth/react';

import ErrorScreen from '@/components/ErrorScreen';
import GameLayout from '@/components/game/GameLayout';
import GameUnderConstructionScreen from '@/components/game/GameUnderConstructionScreen';
import LoadingScreen from '@/components/LoadingScreen';
import { GameProvider } from '@/contexts/GameContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { UserProvider } from '@/contexts/UserContext';
import { useGame } from '@/hooks/firestore/game/useGameHooks';
import { useAllOrganizersOnce } from '@/hooks/firestore/user/useOrganizerHooks';
import { useAllPlayerIdentitiesOnce } from '@/hooks/firestore/user/usePlayerHooks';
import useGameId from '@/hooks/useGameId';
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

  const gameId = useGameId();
  const { game, loading: gameLoading, error: gameError } = useGame(gameId);
  const { organizers, loading: orgLoading, error: orgError } = useAllOrganizersOnce(gameId);
  const { players, loading: playerLoading, error: playerError } = useAllPlayerIdentitiesOnce(gameId);

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
            <GameLayout />
          </GameProvider>
        </TeamProvider>
      </RoleProvider>
    </UserProvider>
  );
}
