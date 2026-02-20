import React from 'react';

import GameRepository from '@/backend/repositories/game/GameRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';

import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import { useSession } from 'next-auth/react';

import { Box, IconButton, Skeleton, Tooltip, Typography } from '@mui/material';

import { CardTitle, CardHeader, CardContent, Card } from '@/frontend/components/card';
import { GameOrganizersAvatarGroup } from '@/frontend/components/home/GameAvatars';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import EditIcon from '@mui/icons-material/Edit';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { GameStatus } from '@/backend/models/games/GameStatus';

export default function GamesUnderConstruction({ lang = DEFAULT_LOCALE }) {
  const gameRepo = new GameRepository();
  const { games, loading, error } = gameRepo.useGamesByStatus(GameStatus.GAME_EDIT);
  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <LoadingScreen loadingText="Loading games under construction..." />;
  }
  if (!games) {
    // Button to create a new round
    return <div>There are no games under construction yet.</div>;
  }

  const sortedGames = games.sort((a, b) => b.dateEnd - a.dateEnd);

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🛠️ {GAMES_UNDER_CONSTRUCTION_CARD_TITLE[lang]} ({sortedGames.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {sortedGames.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">
            {NO_GAMES_UNDER_CONSTRUCTION[lang]}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedGames.map((g) => (
              <GameUnderConstructionCard key={g.id} game={g} lang={lang} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const GAMES_UNDER_CONSTRUCTION_CARD_TITLE = {
  en: 'Games under construction',
  'fr-FR': 'Parties en travaux',
};

const NO_GAMES_UNDER_CONSTRUCTION = {
  en: 'No games under construction',
  'fr-FR': 'Aucune partie en travaux',
};

export function GameUnderConstructionCard({ game, lang = DEFAULT_LOCALE }) {
  const { data: session } = useSession();
  const user = session.user;

  console.log(game);

  const organizerRepo = new OrganizerRepository(game.id);
  //    const { isOrganizer, loading, error } = organizerRepo.useIsOrganizer(user.id)
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

  const isOrganizer = organizers.find((o) => o.id === user.id);
  if (isOrganizer == null) {
    return <></>;
  }

  return (
    <Card className="bg-slate-800/50 border border-yellow-600/20 shadow-lg hover:shadow-yellow-500/40 hover:border-yellow-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Compact Header */}
      <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-br from-yellow-900/20 to-transparent">
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
          {isOrganizer && <EditGameButton gameId={game.id} lang={lang} />}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2">
        {/* Organizers */}
        <Box className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1">
            <SupervisorAccountIcon sx={{ fontSize: '0.875rem', color: 'rgb(251, 191, 36)' }} />
            <Typography variant="caption" className="text-xs font-medium text-yellow-300">
              {ORGANIZERS_LABEL[lang]}
            </Typography>
          </div>
          <div className="flex justify-start w-full">
            <GameOrganizersAvatarGroup gameId={game.id} max={3} size="small" />
          </div>
        </Box>
      </CardContent>
    </Card>
  );
}

function EditGameButton({ gameId, lang }) {
  return (
    <Tooltip title={ACCESS_GAME_EDITOR_BUTTON_LABEL[lang]}>
      <IconButton
        href={'/edit/' + gameId}
        size="small"
        sx={{
          color: 'rgba(252, 211, 77, 0.9)',
          transition: 'all 0.2s',
          '&:hover': {
            color: 'rgba(252, 211, 77, 1)',
            transform: 'rotate(15deg) scale(1.1)',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
          },
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

const ACCESS_GAME_EDITOR_BUTTON_LABEL = {
  en: 'Edit game',
  'fr-FR': 'Éditer la partie',
};

const ORGANIZERS_LABEL = {
  en: 'Organizers',
  'fr-FR': 'Organisateurs',
};
