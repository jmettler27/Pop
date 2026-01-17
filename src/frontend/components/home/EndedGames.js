import GameRepository from '@/backend/repositories/game/GameRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';

import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import { timestampToDate } from '@/backend/utils/time';
import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import React from 'react';

import { useSession } from 'next-auth/react';

import { CardTitle, CardHeader, CardContent, Card } from '@/frontend/components/card';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { GameOrganizersCardContent, GamePlayersCardContent } from '@/frontend/components/home/GameCardContent';

import { Divider, Skeleton, Tooltip } from '@mui/material';
import { IconButton } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="2xl:text-2xl">
          🔚 {ENDED_GAMES_CARD_TITLE[lang]} ({sortedGames.length})
        </CardTitle>
        {/* <RemoveRoundFromGameButton roundId={roundId} /> */}
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {sortedGames.map((game) => (
            <EndedGameCard key={game.id} game={game} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const ENDED_GAMES_CARD_TITLE = {
  en: 'Ended games',
  'fr-FR': 'Parties terminées',
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-around pb-2">
        <CardTitle className="text-lg font-medium">
          {gameTypeToEmoji(game.type)} {localeToEmoji(game.lang)} <i>{game.title}</i>
        </CardTitle>
        {isOrganizer && <AccessGameDashboardButton gameId={game.id} />}
      </CardHeader>

      <CardContent>
        <GameOrganizersCardContent gameId={game.id} lang={lang} />

        <GamePlayersCardContent gameId={game.id} lang={lang} />

        <Divider className="my-2 bg-slate-600" />

        <p className="italic text-sm">{timestampToDate(game.dateEnd, lang)}</p>
      </CardContent>
    </Card>
  );
}

function AccessGameDashboardButton({ gameId, lang = DEFAULT_LOCALE }) {
  return (
    <Tooltip title={ACCESS_GAME_DASHBOARD_BUTTON_LABEL[lang]} placement="top">
      <span>
        <IconButton color="primary" href={'/edit/' + gameId}>
          <DashboardIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

const ACCESS_GAME_DASHBOARD_BUTTON_LABEL = {
  en: 'Access game dashboard',
  'fr-FR': 'Accéder au tableau de bord',
};
