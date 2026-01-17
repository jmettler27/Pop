import { PlayerStatus } from '@/backend/models/users/Player';

import TeamScore from '@/frontend/components/game/top-pane/TeamScore';

import { memo } from 'react';

import { Stack, Avatar } from '@mui/material';

import clsx from 'clsx';

const TopPane = memo(function TopPane({ teams, players }) {
  return (
    <div className="flex flex-row h-full justify-center space-x-9 items-center">
      {teams.map((team) => (
        <TeamItem key={team.id} team={team} players={players.filter((p) => p.teamId === team.id)} />
      ))}
    </div>
  );
});

const TeamItem = memo(function TeamItem({ team, players }) {
  return (
    <div className="flex flex-col h-[90%] items-center justify-around">
      {/* Team name */}
      <div className="flex flex-col h-[5%] items-center justify-center">
        {team.teamAllowed && <TeamName team={team} />}
      </div>

      {/* Team players */}
      <div className="flex h-2/3 items-center p-2 rounded-lg" style={{ border: '2px solid', color: team.color }}>
        <TeamPlayersInfo players={players} />
      </div>

      {/* Team score */}
      <div className="flex flex-col h-[5%] items-center justify-center">
        <TeamScore teamId={team.id} />
      </div>
    </div>
  );
});

const TeamName = memo(function TeamName({ team }) {
  return (
    <span className="2xl:text-3xl" style={{ color: team.color }}>
      <strong>{team.name}</strong>
    </span>
  );
});

const TeamPlayersInfo = memo(function TeamPlayersInfo({ players }) {
  return (
    <Stack className="flex flex-row h-full" direction="row" spacing={3}>
      {players.map((player) => (
        <PlayerItem key={player.id} player={player} />
      ))}
    </Stack>
  );
});

const PlayerItem = memo(function PlayerItem({ player }) {
  return (
    <div className="flex flex-col h-full items-center justify-between">
      {/* Player name */}
      <div className="flex flex-col h-1/6 justify-center items-center">
        <PlayerName player={player} />
      </div>
      {/* Player avatar */}
      <div className="flex flex-col h-[70%] justify-center items-center">
        <PlayerAvatar player={player} />
      </div>
    </div>
  );
});

const PlayerName = memo(function PlayerName({ player }) {
  return (
    <span className={clsx('2xl:text-xl', playerNameGlowColor(player.status), playerNameColor(player.status))}>
      {player.name}
    </span>
  );
});

const PlayerAvatar = memo(function PlayerAvatar({ player }) {
  return (
    <Avatar
      variant="square"
      alt={player.name}
      src={player.image}
      className={clsx('ring-4', playerRingColor(player.status))}
      sx={{ height: '90%', width: 'auto' }}
    />
  );
});

// Utility functions for player status styling
const playerNameColor = (playerStatus) => {
  switch (playerStatus) {
    case PlayerStatus.FOCUS:
      return 'text-focus';
    case PlayerStatus.CORRECT:
      return 'text-correct';
    case PlayerStatus.WRONG:
      return 'text-wrong';
    case PlayerStatus.READY:
      return 'text-ready';
    case PlayerStatus.IDLE:
    default:
      return 'text-inherit';
  }
};

const playerNameGlowColor = (playerStatus) => {
  switch (playerStatus) {
    case PlayerStatus.FOCUS:
      return 'glow-focus';
    case PlayerStatus.CORRECT:
      return 'glow-correct';
    case PlayerStatus.WRONG:
      return 'glow-wrong';
    case PlayerStatus.READY:
      return 'glow-ready';
    case PlayerStatus.IDLE:
    default:
      return '';
  }
};

const playerRingColor = (playerStatus) => {
  switch (playerStatus) {
    case PlayerStatus.FOCUS:
      return 'ring-focus';
    case PlayerStatus.CORRECT:
      return 'ring-correct';
    case PlayerStatus.WRONG:
      return 'ring-wrong';
    case PlayerStatus.READY:
      return 'ring-ready';
    case PlayerStatus.IDLE:
    default:
      return 'ring-inherit';
  }
};

export default TopPane;
