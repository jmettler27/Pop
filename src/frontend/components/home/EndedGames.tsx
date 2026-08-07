import NextLink from 'next/link';

import { Clock, LayoutDashboard, UserCog, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import GameRepository from '@/backend/repositories/game/GameRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Skeleton } from '@/frontend/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { Locale, localeToEmoji } from '@/frontend/helpers/locales';
import { timestampToDate, type FirestoreTimestamp } from '@/frontend/helpers/time';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { type GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { gameTypeToEmoji } from '@/models/games/game-type';

const messages = defineMessages('frontend.home.EndedGames', {
  title: 'Ended games',
  empty: 'No ended games yet',
  accessDashboard: 'Access game dashboard',
});

export default function EndedGames() {
  const intl = useIntl();
  const gameRepo = new GameRepository();
  const { games, loading, error } = gameRepo.useGamesByStatus(GameStatus.GAME_END);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!games) {
    // Button to create a new round
    return <div>There are no games under construction yet.</div>;
  }

  const sortedGames = games.sort((a, b) => (b.dateEnd as number) - (a.dateEnd as number));

  return (
    <Card className="bg-linear-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          🔚 {intl.formatMessage(messages.title)}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {sortedGames.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">
            {intl.formatMessage(messages.empty)}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedGames.map((game) => (
              <EndedGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EndedGameCardProps {
  game: GameRounds;
}

export function EndedGameCard({ game }: EndedGameCardProps) {
  const intl = useIntl();
  const { data: session } = useSession();
  const user = session?.user;

  const organizerRepo = new OrganizerRepository(game.id ?? '');
  const playerRepo = new PlayerRepository(game.id ?? '');
  const { organizers, loading: organizersLoading, error: organizersError } = organizerRepo.useAllOrganizersOnce();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayersOnce();

  if (organizersError || playersError) {
    return <></>;
  }
  if (organizersLoading || playersLoading) {
    return <Skeleton className="w-[210px] h-[60px]" />;
  }

  const isOrganizer = organizers.some((o) => o.id === user?.id);
  const isPlayer = players.some((p) => p.id === user?.id);
  if (!isOrganizer && !isPlayer) return null;

  return (
    <Card
      size="sm"
      className="bg-slate-800/50 border border-purple-600/20 shadow-lg hover:shadow-purple-500/40 hover:border-purple-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Compact Header */}
      <CardHeader className="pb-2 pt-3 px-3 bg-linear-to-br from-purple-900/20 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger render={<div className="flex items-center gap-2" />}>
                <span className="text-lg shrink-0">{gameTypeToEmoji(game.type)}</span>
                <CardTitle className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
                  {game.title}
                </CardTitle>
                <span className="text-base shrink-0">{localeToEmoji((game as unknown as { lang: Locale }).lang)}</span>
              </TooltipTrigger>
              <TooltipContent>{game.title}</TooltipContent>
            </Tooltip>
          </div>
          {isOrganizer && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    nativeButton={false}
                    render={<NextLink href={'/edit/' + game.id} />}
                    className="text-[rgba(147,197,253,0.9)] transition-all duration-200 hover:text-[rgba(147,197,253,1)] hover:rotate-[15deg] hover:scale-110 hover:bg-[rgba(59,130,246,0.1)]"
                  />
                }
              >
                <LayoutDashboard className="size-5" />
              </TooltipTrigger>
              <TooltipContent>{intl.formatMessage(messages.accessDashboard)}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-1 space-y-2">
        {/* Organizers & Players - Compact Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Organizers */}
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <UserCog className="size-3.5 text-purple-500" />
              <span className="text-xs font-medium text-purple-300">
                {intl.formatMessage(globalMessages.organizers)}
              </span>
            </div>
            <div className="flex justify-start w-full">
              <GameOrganizersAvatarGroup gameId={game.id ?? ''} max={3} size="small" />
            </div>
          </div>

          {/* Players */}
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <Users className="size-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">{intl.formatMessage(globalMessages.players)}</span>
            </div>
            <div className="flex justify-start w-full">
              <GamePlayersAvatarGroup gameId={game.id ?? ''} max={3} size="small" />
            </div>
          </div>
        </div>

        {/* Date Footer with Icon */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-700/50">
          <Clock className="size-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">
            {timestampToDate(game.dateEnd as FirestoreTimestamp | null | undefined, intl.locale)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
