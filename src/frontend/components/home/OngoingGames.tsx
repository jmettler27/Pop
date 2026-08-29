import { useRouter } from 'next/navigation';

import clsx from 'clsx';
import { or, query, where } from 'firebase/firestore';
import { Eye, LogIn, Play, UserCog, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import { GAMES_COLLECTION_REF } from '@/firebase/firestore';
import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { Locale, localeToEmoji } from '@/frontend/helpers/locales';
import { useFirestoreCollectionOnce } from '@/frontend/hooks/firestore/useFirestoreCollection';
import { useAllOrganizersOnce } from '@/frontend/hooks/firestore/user/useOrganizerHooks';
import { useAllPlayersOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameStatus } from '@/models/games/game-status';
import { GameType, gameTypeToEmoji } from '@/models/games/game-type';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.home.OngoingGames', {
  title: 'Ongoing games',
  empty: 'No ongoing games at the moment',
  watchGame: 'Watch',
  joinGame: 'Join',
  continueGame: 'Continue',
});

interface GameDocData {
  title?: string;
  type?: string;
  lang?: string;
  maxPlayers?: number;
  dateStart?: number;
  [key: string]: unknown;
}

const ONGOING_GAME_STATUSES = [
  GameStatus.GAME_START,
  GameStatus.GAME_HOME,
  GameStatus.ROUND_START,
  GameStatus.QUESTION_ACTIVE,
  GameStatus.QUESTION_END,
  GameStatus.ROUND_END,
];

export default function OngoingGames() {
  const intl = useIntl();
  const {
    data: games,
    isLoading: gamesLoading,
    error: gamesError,
  } = useFirestoreCollectionOnce(
    query(GAMES_COLLECTION_REF, or(...ONGOING_GAME_STATUSES.map((status) => where('status', '==', status)))),
    ['games', 'ongoing', ...ONGOING_GAME_STATUSES]
  );
  if (gamesError) {
    return <></>;
  }
  if (gamesLoading) {
    return <Skeleton className="w-[210px] h-[60px]" />;
  }
  if (!games) {
    return <></>;
  }
  const sortedOngoingGames = (games as ({ id: string } & GameDocData)[]).sort(
    (a, b) => (b.dateStart ?? 0) - (a.dateStart ?? 0)
  );

  return (
    <Card className="bg-linear-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-md lg:text-base xl:text-xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          🕒 {intl.formatMessage(messages.title)} ({sortedOngoingGames.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {sortedOngoingGames.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">
            {intl.formatMessage(messages.empty)}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedOngoingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GameCardProps {
  game: { id: string } & GameDocData;
}

const GameCard = ({ game }: GameCardProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const { organizers, loading: organizersLoading, error: organizersError } = useAllOrganizersOnce(game.id);
  const { players, loading: playersLoading, error: playersError } = useAllPlayersOnce(game.id);

  if (organizersError || playersError) {
    return <></>;
  }
  if (organizersLoading || playersLoading) {
    return <Skeleton className="w-[210px] h-[60px]" />;
  }
  if (!organizers || !players) {
    return <></>;
  }

  const organizerIds = organizers.map((o) => o.id);
  const playerIds = players.map((p) => p.id);
  const isFull = playerIds.length >= (game.maxPlayers ?? 0);

  const isPlayer = playerIds.some((id) => id === user?.id);
  const isOrganizer = organizerIds.some((id) => id === user?.id);

  let role: string;

  if (isOrganizer) {
    role = ParticipantRole.ORGANIZER;
  } else if (isPlayer) {
    role = ParticipantRole.PLAYER;
  } else {
    role = ParticipantRole.SPECTATOR;
  }

  const buttonText = () => {
    if (role === ParticipantRole.PLAYER || role === ParticipantRole.ORGANIZER)
      return intl.formatMessage(messages.continueGame);
    if (role === ParticipantRole.SPECTATOR)
      return isFull ? intl.formatMessage(messages.watchGame) : intl.formatMessage(messages.joinGame);
  };

  const buttonIcon = () => {
    if (role === ParticipantRole.PLAYER || role === ParticipantRole.ORGANIZER) return <Play className="ml-2 size-4" />;
    if (role === ParticipantRole.SPECTATOR)
      return isFull ? <Eye className="ml-2 size-4" /> : <LogIn className="ml-2 size-4" />;
  };

  const buttonColor = () => {
    if (role === ParticipantRole.PLAYER || role === ParticipantRole.ORGANIZER) return 'success' as const;
    if (role === ParticipantRole.SPECTATOR) return isFull ? ('warning' as const) : ('primary' as const);
  };

  const buttonColorClassName = () => {
    const color = buttonColor();
    if (color === 'success') return 'border-green-500 text-green-500 hover:bg-green-500/10';
    if (color === 'warning') return 'border-amber-500 text-amber-500 hover:bg-amber-500/10';
    return '';
  };

  const handleJoinClick = () => {
    if (role === ParticipantRole.SPECTATOR && !isFull) {
      router.push(`/join/${game.id}`);
    } else {
      router.push(`/${game.id}`);
    }
  };

  return (
    <Card
      size="sm"
      className="bg-slate-800/50 border border-orange-600/20 shadow-lg hover:shadow-orange-500/40 hover:border-orange-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Compact Header */}
      <CardHeader className="pb-2 pt-3 px-3 bg-linear-to-br from-orange-900/20 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger render={<div className="flex items-center gap-2" />}>
                <span className="text-lg shrink-0">{gameTypeToEmoji(game.type as GameType)}</span>
                <CardTitle className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
                  {game.title}
                </CardTitle>
                <span className="text-base shrink-0">{localeToEmoji(game.lang as Locale)}</span>
              </TooltipTrigger>
              <TooltipContent>{game.title}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-1 space-y-2">
        {/* Organizers & Players - Compact Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Organizers */}
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <UserCog className="size-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-300">
                {intl.formatMessage(globalMessages.organizers)}
              </span>
            </div>
            <div className="flex justify-start w-full">
              <GameOrganizersAvatarGroup gameId={game.id} max={3} size="small" />
            </div>
          </div>

          {/* Players */}
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <Users className="size-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">{intl.formatMessage(globalMessages.players)}</span>
            </div>
            <div className="flex justify-start w-full">
              <GamePlayersAvatarGroup gameId={game.id} max={3} size="small" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={handleJoinClick}
            className={clsx(
              'w-full normal-case font-semibold text-sm px-4 py-1.5 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
              buttonColorClassName()
            )}
          >
            {buttonText()}
            {buttonIcon()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
