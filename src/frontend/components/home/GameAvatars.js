import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';

import { Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { Skeleton } from '@mui/material';

export function GameOrganizersAvatarGroup({ gameId, max = 4, size = 'medium' }) {
  const organizerRepo = new OrganizerRepository(gameId);
  const { organizers, loading, error } = organizerRepo.useAllOrganizersOnce();

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <Skeleton variant="rounded" width={210} height={60} />;
  }
  if (!organizers) {
    return <></>;
  }

  const sizeMap = {
    small: { xs: 28, sm: 30, md: 32 },
    medium: { xs: 32, sm: 36, md: 40 },
    large: { xs: 40, sm: 44, md: 48 },
  };

  const avatarSizes = sizeMap[size] || sizeMap.medium;

  return (
    <AvatarGroup
      max={max}
      sx={{
        '& .MuiAvatar-root': {
          width: avatarSizes,
          height: avatarSizes,
          fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
          border: '2px solid #1e293b',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.15)',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        },
      }}
    >
      {organizers.map((organizer) => (
        <Tooltip key={organizer.id} title={organizer.name} placement="top" arrow>
          <Avatar src={organizer.image} alt={organizer.name} />
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}

export function GamePlayersAvatarGroup({ gameId, max = 4, size = 'medium' }) {
  const playerRepo = new PlayerRepository(gameId);
  const { players, loading, error } = playerRepo.useAllPlayersOnce();

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <Skeleton variant="rounded" width={210} height={60} />;
  }
  if (!players) {
    return <></>;
  }

  const sizeMap = {
    small: { xs: 28, sm: 30, md: 32 },
    medium: { xs: 32, sm: 36, md: 40 },
    large: { xs: 40, sm: 44, md: 48 },
  };

  const avatarSizes = sizeMap[size] || sizeMap.medium;

  return (
    <AvatarGroup
      max={max}
      sx={{
        '& .MuiAvatar-root': {
          width: avatarSizes,
          height: avatarSizes,
          fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
          border: '2px solid #1e293b',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.15)',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        },
      }}
    >
      {players.map((player) => (
        <Tooltip key={player.id} title={player.name} placement="top" arrow>
          <Avatar src={player.image} alt={player.name} />
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}
