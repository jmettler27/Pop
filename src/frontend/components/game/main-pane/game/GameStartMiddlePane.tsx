'use client';

import { Avatar } from '@mui/material';
import { useIntl } from 'react-intl';
import QRCode from 'react-qr-code';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useHasMounted from '@/frontend/hooks/useHasMounted';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { Organizer } from '@/models/users/organizer';

const messages = defineMessages('frontend.game.middlePane.GameStartMiddlePane', {
  scanToJoin: 'Scan to join!',
  rounds: '{count} rounds',
  maxPlayers: 'Max {count} players',
  hostedBy: 'Hosted by',
});

export default function GameStartMiddlePane() {
  const game = useGame();
  const intl = useIntl();
  const gameRepositories = useGameRepositories();

  if (!game) return null;
  if (!gameRepositories) return null;

  const { organizerRepo } = gameRepositories;
  const { organizers, loading: orgLoading, error: orgError } = organizerRepo.useAllOrganizersOnce();

  if (orgLoading) return <LoadingScreen inline />;
  if (orgError) return <ErrorScreen inline />;

  const roundCount = game instanceof GameRounds ? (game.rounds?.length ?? 0) : 0;
  const maxPlayers = game.maxPlayers;

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

      {/* Row 2: Organizers */}
      <div className="flex flex-col items-center justify-center gap-4 py-4 shrink-0">
        <span className="text-base uppercase tracking-widest text-white/40">
          {intl.formatMessage(messages.hostedBy)}
        </span>
        {organizers.map((o: Organizer) => (
          <OrganizerItem key={o.id as string} organizer={o} />
        ))}
      </div>

      {/* Row 3: QR code */}
      <div className="flex flex-1 justify-center items-center">
        <JoinQRCode gameId={game.id!} scanToJoinLabel={intl.formatMessage(messages.scanToJoin)} />
      </div>
    </div>
  );
}

function JoinQRCode({ gameId, scanToJoinLabel }: { gameId: string; scanToJoinLabel: string }) {
  const hasMounted = useHasMounted();
  const joinUrl = hasMounted ? `${window.location.origin}/join/${gameId}` : '';

  if (!joinUrl) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl overflow-hidden bg-white p-3 shadow-lg">
        <QRCode value={joinUrl} size={375} bgColor="white" fgColor="#1e293b" />
      </div>
      <span className="text-2xl text-white/60">{scanToJoinLabel}</span>
    </div>
  );
}

function OrganizerItem({ organizer }: { organizer: Organizer }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar alt={organizer.name as string} src={organizer.image!} sx={{ width: 100, height: 100 }} />
      <span className="text-base font-medium text-white/80 text-center">{organizer.name as string}</span>
    </div>
  );
}
