import NextLink from 'next/link';

import { Pencil, UserCog } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import { GameOrganizersAvatarGroup } from '@/frontend/components/home/GameAvatars';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { Locale, localeToEmoji } from '@/frontend/helpers/locales';
import { useAllOrganizersOnce } from '@/frontend/hooks/firestore/user/useOrganizerHooks';
import { useAllPlayersOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import { useGamesUnderConstruction } from '@/frontend/hooks/gameLists';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { type GameRoundsData } from '@/models/games/game';
import { gameTypeToEmoji, type GameType } from '@/models/games/game-type';

const messages = defineMessages('frontend.home.GamesUnderConstruction', {
  title: 'Games under construction',
  empty: 'No games under construction',
  editGame: 'Edit game',
});

export default function GamesUnderConstruction() {
  const intl = useIntl();
  const { status: sessionStatus } = useSession();

  const { games, loading, error } = useGamesUnderConstruction();

  if (error) {
    return <></>;
  }
  if (loading || sessionStatus === 'loading') {
    return <LoadingScreen inline />;
  }
  if (!games) {
    return <></>;
  }

  return (
    <Card className="bg-linear-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🛠️ {intl.formatMessage(messages.title)}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {games.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">
            {intl.formatMessage(messages.empty)}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((g) => (
              <GameUnderConstructionCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GameUnderConstructionCardProps {
  game: GameRoundsData;
}

export function GameUnderConstructionCard({ game }: GameUnderConstructionCardProps) {
  const intl = useIntl();
  const { data: session } = useSession();
  const user = session?.user;

  const { organizers, loading: organizersLoading, error: organizersError } = useAllOrganizersOnce(game.id ?? null);
  const { players, loading: playersLoading, error: playersError } = useAllPlayersOnce(game.id ?? null);

  if (organizersError || playersError) {
    return <></>;
  }
  if (organizersLoading || playersLoading) {
    return <Skeleton className="w-[210px] h-[60px]" />;
  }
  if (!organizers || !players) {
    return <></>;
  }

  const isPlayer = players.some((p) => p.id === user?.id);
  const isOrganizer = organizers.some((o) => o.id === user?.id);
  if (!isOrganizer && !isPlayer) return null;

  return (
    <Card
      size="sm"
      className="bg-slate-800/50 border border-yellow-600/20 shadow-lg hover:shadow-yellow-500/40 hover:border-yellow-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Compact Header */}
      <CardHeader className="pb-2 pt-3 px-3 bg-linear-to-br from-yellow-900/20 to-transparent">
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
          {isOrganizer && <EditGameButton gameId={game.id ?? ''} />}
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-1">
        {/* Organizers */}
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1">
            <UserCog className="size-3.5 text-amber-400" />
            <span className="text-xs font-medium text-yellow-300">{intl.formatMessage(globalMessages.organizers)}</span>
          </div>
          <div className="flex justify-start w-full">
            <GameOrganizersAvatarGroup gameId={game.id ?? ''} max={3} size="small" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EditGameButtonProps {
  gameId: string;
}

function EditGameButton({ gameId }: EditGameButtonProps) {
  const intl = useIntl();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<NextLink href={'/edit/' + gameId} />}
            className="text-[rgba(252,211,77,0.9)] transition-all duration-200 hover:text-[rgba(252,211,77,1)] hover:rotate-[15deg] hover:scale-110 hover:bg-[rgba(234,179,8,0.1)]"
          />
        }
      >
        <Pencil className="size-5" />
      </TooltipTrigger>
      <TooltipContent>{intl.formatMessage(messages.editGame)}</TooltipContent>
    </Tooltip>
  );
}
