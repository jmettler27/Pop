import GameRepository from '@/backend/repositories/game/GameRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';

import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import { timestampToDate } from '@/backend/utils/time';
import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import React from 'react';

import { useSession } from 'next-auth/react';

import { CardTitle, CardHeader, CardContent, Card } from '@/frontend/components/card';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';

import { Box, Chip, Skeleton, Tooltip, Typography } from '@mui/material';
import { IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import { GameStatus } from '@/backend/models/games/GameStatus';

export default function EndedGames({ lang = DEFAULT_LOCALE }) {
  const gameRepo = new GameRepository();
  const { games, loading, error } = gameRepo.useGamesByStatus(GameStatus.GAME_END);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <LoadingScreen loadingText="Loading ended games..." />;
  }
  if (!games) {
    // Button to create a new round
    return <div>There are no games under construction yet.</div>;
  }

  const sortedGames = games.sort((a, b) => b.dateEnd - a.dateEnd);

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          🔚 {ENDED_GAMES_CARD_TITLE[lang]} ({sortedGames.length})
        </CardTitle>
        {/* <RemoveRoundFromGameButton roundId={roundId} /> */}
      </CardHeader>

      <CardContent className="pt-6">
        {sortedGames.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">{NO_ENDED_GAMES[lang]}</div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedGames.map((game) => (
              <EndedGameCard key={game.id} game={game} lang={lang} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ENDED_GAMES_CARD_TITLE = {
  en: 'Ended games',
  'fr-FR': 'Parties terminées',
};

const NO_ENDED_GAMES = {
  en: 'No ended games yet',
  'fr-FR': 'Aucune partie terminée pour le moment',
};

export function EndedGameCard({ game, lang = DEFAULT_LOCALE }) {
  const { data: session } = useSession();
  const user = session.user;

  const organizerRepo = new OrganizerRepository(game.id);
  const { isOrganizer, loading, error } = organizerRepo.useIsOrganizer(user.id);

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

  return (
    <Card className="bg-slate-800/50 border border-purple-600/20 shadow-lg hover:shadow-purple-500/40 hover:border-purple-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Compact Header */}
      <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-br from-purple-900/20 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Tooltip title={game.title} placement="top">
              <div className="flex items-center gap-2">
                <span className="text-lg flex-shrink-0">{gameTypeToEmoji(game.type)}</span>
                <CardTitle className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
                  {game.title}
                </CardTitle>
                <span className="text-base flex-shrink-0">{localeToEmoji(game.lang)}</span>
              </div>
            </Tooltip>
          </div>
          {isOrganizer && (
            <Tooltip title={ACCESS_GAME_DASHBOARD_BUTTON_LABEL[lang]} placement="top">
              <IconButton
                href={'/edit/' + game.id}
                size="small"
                sx={{
                  color: 'rgba(147, 197, 253, 0.9)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: 'rgba(147, 197, 253, 1)',
                    transform: 'rotate(15deg) scale(1.1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  },
                }}
              >
                <DashboardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2 space-y-3">
        {/* Organizers & Players - Compact Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Organizers */}
          <Box className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <SupervisorAccountIcon sx={{ fontSize: '0.875rem', color: 'rgb(168, 85, 247)' }} />
              <Typography variant="caption" className="text-xs font-medium text-purple-300">
                {ORGANIZERS_SHORT[lang]}
              </Typography>
            </div>
            <div className="flex justify-start w-full">
              <GameOrganizersAvatarGroup gameId={game.id} max={3} size="small" />
            </div>
          </Box>

          {/* Players */}
          <Box className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <GroupIcon sx={{ fontSize: '0.875rem', color: 'rgb(96, 165, 250)' }} />
              <Typography variant="caption" className="text-xs font-medium text-blue-300">
                {PLAYERS_SHORT[lang]}
              </Typography>
            </div>
            <div className="flex justify-start w-full">
              <GamePlayersAvatarGroup gameId={game.id} max={3} size="small" />
            </div>
          </Box>
        </div>

        {/* Date Footer with Icon */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/50">
          <AccessTimeIcon sx={{ fontSize: '0.875rem', color: 'rgb(148, 163, 184)' }} />
          <Typography variant="caption" className="text-xs text-slate-400">
            {timestampToDate(game.dateEnd, lang)}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

const ORGANIZERS_SHORT = {
  en: 'Organizers',
  'fr-FR': 'Organisateurs',
};

const PLAYERS_SHORT = {
  en: 'Players',
  'fr-FR': 'Joueurs',
};

const ACCESS_GAME_DASHBOARD_BUTTON_LABEL = {
  en: 'Access game dashboard',
  'fr-FR': 'Accéder au tableau de bord',
};
