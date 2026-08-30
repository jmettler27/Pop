import { memo } from 'react';

import clsx from 'clsx';

import TeamScore from '@/components/game/top-pane/TeamScore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Team from '@/models/team';
import { Player, PlayerStatus } from '@/models/users/player';

type ScoresMap = Record<string, unknown> | undefined;

interface TopPaneProps {
  teams: Team[];
  players: Player[];
  scores: ScoresMap;
  scoresLoading: boolean;
}

const TopPane = memo(function TopPane({ teams, players, scores, scoresLoading }: TopPaneProps) {
  return (
    <div className="flex flex-row h-full justify-center space-x-9 items-center">
      {teams.map((team) => (
        <TeamItem
          key={team.id}
          team={team}
          players={players.filter((p) => p.teamId === team.id)}
          scores={scores}
          scoresLoading={scoresLoading}
        />
      ))}
    </div>
  );
});

interface TeamItemProps {
  team: Team;
  players: Player[];
  scores: ScoresMap;
  scoresLoading: boolean;
}

const TeamItem = memo(function TeamItem({ team, players, scores, scoresLoading }: TeamItemProps) {
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
        <TeamScore teamId={team.id as string} scores={scores} loading={scoresLoading} />
      </div>
    </div>
  );
});

const TeamName = memo(function TeamName({ team }: { team: Team }) {
  return (
    <span className="2xl:text-3xl" style={{ color: team.color }}>
      <strong>{team.name}</strong>
    </span>
  );
});

const TeamPlayersInfo = memo(function TeamPlayersInfo({ players }: { players: Player[] }) {
  return (
    <div className="flex flex-row h-full gap-6">
      {players.map((player) => (
        <PlayerItem key={player.id} player={player} />
      ))}
    </div>
  );
});

const PlayerItem = memo(function PlayerItem({ player }: { player: Player }) {
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

const PlayerName = memo(function PlayerName({ player }: { player: Player }) {
  const status = player.status ?? '';
  return (
    <span className={clsx('2xl:text-xl', playerNameGlowColor(status), playerNameColor(status))}>{player.name}</span>
  );
});

const PlayerAvatar = memo(function PlayerAvatar({ player }: { player: Player }) {
  const status = player.status ?? '';
  return (
    <Avatar className={clsx('h-[90%] w-auto after:border-0', playerAvatarBorderColor(status))}>
      <AvatarImage alt={player.name} src={player.image ?? undefined} />
      <AvatarFallback>{player.name?.[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
});

// Utility functions for player status styling
const playerNameColor = (playerStatus: string) => {
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

const playerNameGlowColor = (playerStatus: string) => {
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

const playerAvatarBorderColor = (playerStatus: string) => {
  switch (playerStatus) {
    case PlayerStatus.FOCUS:
      return 'ring-3 ring-focus';
    case PlayerStatus.CORRECT:
      return 'ring-3 ring-correct';
    case PlayerStatus.WRONG:
      return 'ring-3 ring-wrong';
    case PlayerStatus.READY:
      return 'ring-3 ring-ready';
    case PlayerStatus.IDLE:
    default:
      return '';
  }
};

export default TopPane;
