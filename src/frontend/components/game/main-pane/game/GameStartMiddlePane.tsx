'use client';

import { useEffect, useState } from 'react';

import { Avatar } from '@mui/material';
import { useIntl } from 'react-intl';
import QRCode from 'react-qr-code';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import Team from '@/models/team';
import { Organizer } from '@/models/users/organizer';
import { Player } from '@/models/users/player';

const messages = defineMessages('frontend.game.middlePane.GameStartMiddlePane', {
  scanToJoin: 'Scan to join',
  players: '{count} players',
  rounds: '{count} rounds',
  maxPlayers: 'Max {count}',
  waitingForPlayers: 'Waiting for players to join…',
  hostedBy: 'Hosted by',
});

export default function GameStartMiddlePane() {
  const game = useGame();
  const intl = useIntl();
  const gameRepositories = useGameRepositories();

  if (!game) return null;
  if (!gameRepositories) return null;

  const { organizerRepo, teamRepo, playerRepo } = gameRepositories;
  const { organizers, loading: orgLoading, error: orgError } = organizerRepo.useAllOrganizersOnce();
  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayers();

  if (orgLoading || teamsLoading || playersLoading) return <LoadingScreen inline />;
  if (orgError || teamsError || playersError) return <ErrorScreen inline />;

  const roundCount = game instanceof GameRounds ? (game.rounds?.length ?? 0) : 0;
  const playerCount = players?.length ?? 0;
  const maxPlayers = game.maxPlayers;
  const allPlayers = players ?? [];
  const allTeams = teams ?? [];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden px-8 py-5 gap-5">
      {/* Row 1: Title + meta */}
      <div className="flex flex-col items-center shrink-0 gap-2">
        <h1 className="text-4xl lg:text-5xl 2xl:text-6xl font-bold text-yellow-300 italic text-center">{game.title}</h1>
        <div className="flex items-center gap-8">
          {roundCount > 0 && (
            <span className="text-xl lg:text-2xl text-white">
              🎯 {intl.formatMessage(messages.rounds, { count: roundCount })}
            </span>
          )}
          {maxPlayers != null && (
            <span className="text-xl lg:text-2xl text-white">
              👥 {intl.formatMessage(messages.maxPlayers, { count: maxPlayers })}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Organizers + Teams */}
      <div className="flex flex-row shrink-0">
        {/* Left: organizers — 50% */}
        <div className="flex flex-col items-center justify-center gap-4 w-1/2 py-4">
          <span className="text-xs uppercase tracking-widest text-white/40">
            {intl.formatMessage(messages.hostedBy)}
          </span>
          {organizers.map((o: Organizer) => (
            <OrganizerItem key={o.id as string} organizer={o} />
          ))}
        </div>

        <div className="w-px self-stretch bg-white/25 shrink-0" />

        {/* Right: teams — 50% */}
        <div className="flex flex-col w-1/2 gap-3 py-4 pl-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-lg font-semibold text-green-400">
              {intl.formatMessage(messages.players, { count: playerCount })}
              {maxPlayers != null ? ` / ${maxPlayers}` : ''}
            </span>
          </div>

          {allTeams.length > 0 ? (
            <div className="flex flex-row flex-wrap gap-4">
              {allTeams.map((team) => {
                const teamPlayers = allPlayers.filter((p) => p.teamId === (team.id as string));
                return <TeamCard key={team.id as string} team={team} players={teamPlayers} />;
              })}
            </div>
          ) : (
            <p className="text-xl text-white/30 animate-pulse">{intl.formatMessage(messages.waitingForPlayers)}</p>
          )}
        </div>
      </div>

      {/* Row 3: QR code */}
      <div className="flex flex-1 justify-center items-center">
        <JoinQRCode gameId={game.id!} scanToJoinLabel={intl.formatMessage(messages.scanToJoin)} />
      </div>
    </div>
  );
}

function JoinQRCode({ gameId, scanToJoinLabel }: { gameId: string; scanToJoinLabel: string }) {
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${gameId}`);
  }, [gameId]);

  if (!joinUrl) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-xl overflow-hidden bg-white p-3 shadow-lg">
        <QRCode value={joinUrl} size={250} bgColor="white" fgColor="#1e293b" />
      </div>
      <span className="text-base text-white/60">{scanToJoinLabel}</span>
    </div>
  );
}

function OrganizerItem({ organizer }: { organizer: Organizer }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar alt={organizer.name as string} src={organizer.image!} sx={{ width: 56, height: 56 }} />
      <span className="text-base font-medium text-white/80 text-center">{organizer.name as string}</span>
    </div>
  );
}

function TeamCard({ team, players }: { team: Team; players: Player[] }) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-white/10 min-w-[200px]"
      style={{ borderTopColor: team.color, borderTopWidth: 4, backgroundColor: team.color + '18' }}
    >
      <div className="px-5 py-3">
        <span className="text-xl lg:text-2xl font-bold" style={{ color: team.color }}>
          {team.name}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-5 pb-4">
        {players.map((p) => (
          <PlayerRow key={p.id as string} player={p} />
        ))}
        {players.length === 0 && <span className="text-base text-white/30 italic">—</span>}
      </div>
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar
        alt={player.name as string}
        src={player.image ?? undefined}
        sx={{ width: 32, height: 32, fontSize: 13 }}
      />
      <span className="text-base lg:text-lg font-medium text-white/90 truncate">{player.name as string}</span>
    </div>
  );
}
