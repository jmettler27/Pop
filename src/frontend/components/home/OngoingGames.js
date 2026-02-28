import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { UserRole } from '@/backend/models/users/User';
import { gameTypeToEmoji } from '@/backend/models/games/GameType';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { or, query, where } from 'firebase/firestore';
import { useCollectionOnce } from 'react-firebase-hooks/firestore';

import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/card';
import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';
import GameErrorScreen from '@/frontend/components/game/GameErrorScreen';

import { styled } from '@mui/material/styles';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import LoginIcon from '@mui/icons-material/Login';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';

export default function OngoingGames({ lang = DEFAULT_LOCALE }) {
  const [games, gamesLoading, gamesError] = useCollectionOnce(
    query(
      GAMES_COLLECTION_REF,
      or(
        where('status', '==', GameStatus.GAME_START),
        where('status', '==', GameStatus.GAME_HOME),
        where('status', '==', GameStatus.ROUND_START),
        where('status', '==', GameStatus.QUESTION_ACTIVE),
        where('status', '==', GameStatus.QUESTION_END),
        where('status', '==', GameStatus.ROUND_END),
        where('status', '==', GameStatus.SPECIAL)
      )
    )
  );
  if (gamesError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gamesError)}</strong>
      </p>
    );
  }
  if (gamesLoading) {
    return <Skeleton variant="rounded" width={210} height={60} />;
  }
  if (!games) {
    return <></>;
  }
  const sortedOngoingGames = games.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => b.dateStart - a.dateStart);

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-md lg:text-base xl:text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          🕒 {ONGOING_GAMES_CARD_TITLE[lang]} ({sortedOngoingGames.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {sortedOngoingGames.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">{NO_ONGOING_GAMES[lang]}</div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedOngoingGames.map((game) => (
              <GameCard key={game.id} game={game} lang={lang} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ONGOING_GAMES_CARD_TITLE = {
  en: 'Ongoing games',
  'fr-FR': 'Parties en cours',
};

const NO_ONGOING_GAMES = {
  en: 'No ongoing games at the moment',
  'fr-FR': 'Aucune partie en cours pour le moment',
};

const GameCard = ({ game, lang }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session.user;

  const organizerRepo = new OrganizerRepository(game.id);
  const playerRepo = new PlayerRepository(game.id);

  const { organizers, loading: organizersLoading, error: organizersError } = organizerRepo.useAllOrganizersOnce();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayersOnce();

  if (organizersError || playersError) {
    return <GameErrorScreen />;
  }
  if (organizersLoading || playersLoading) {
    return <Skeleton variant="rounded" width={210} height={60} />;
  }
  if (!organizers || !players) {
    return <GameErrorScreen />; // TODO: Change this
  }

  const organizerIds = organizers.map((doc) => doc.id);
  const playerIds = players.map((doc) => doc.id);

  const isFull = playerIds.length >= game.maxPlayers;

  let myRole = null;
  if (organizerIds.includes(user.id)) {
    myRole = UserRole.ORGANIZER;
  } else if (playerIds.includes(user.id)) {
    myRole = UserRole.PLAYER;
  } else {
    myRole = UserRole.SPECTATOR;
  }

  const buttonText = () => {
    if (myRole === UserRole.PLAYER || myRole === UserRole.ORGANIZER) return CONTINUE_GAME[lang];
    if (myRole === UserRole.SPECTATOR) return isFull ? WATCH_GAME[lang] : JOIN_GAME[lang];
  };

  const ButtonIcon = () => {
    if (myRole === UserRole.PLAYER || myRole === UserRole.ORGANIZER) return <PlayArrowIcon />;
    if (myRole === UserRole.SPECTATOR) return isFull ? <VisibilityIcon /> : <LoginIcon />;
  };

  const buttonColor = () => {
    if (myRole === UserRole.PLAYER || myRole === UserRole.ORGANIZER) return 'success';
    if (myRole === UserRole.SPECTATOR) return isFull ? 'warning' : 'primary';
  };

  const handleJoinClick = () => {
    if (myRole === UserRole.SPECTATOR && !isFull) {
      router.push(`/join/${game.id}`);
    } else {
      router.push(`/${game.id}`);
    }
  };

  return (
    <Card className="bg-slate-800/50 border border-orange-600/20 shadow-lg hover:shadow-orange-500/40 hover:border-orange-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Compact Header */}
      <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-br from-orange-900/20 to-transparent">
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
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-2 space-y-3">
        {/* Organizers & Players - Compact Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Organizers */}
          <Box className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1">
              <SupervisorAccountIcon sx={{ fontSize: '0.875rem', color: 'rgb(249, 115, 22)' }} />
              <Typography variant="caption" className="text-xs font-medium text-orange-300">
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

        {/* Action Button */}
        <div className="mt-3">
          <JoinGameButton
            variant="outlined"
            color={buttonColor()}
            endIcon={<ButtonIcon />}
            onClick={handleJoinClick}
            fullWidth
          >
            {buttonText()}
          </JoinGameButton>
        </div>
      </CardContent>
    </Card>
  );
};

const JoinGameButton = styled(Button)(({ theme }) => ({
  '& > *': {
    textTransform: 'none !important',
  },
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: '8px 16px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
}));

const ORGANIZERS_SHORT = {
  en: 'Organizers',
  'fr-FR': 'Organisateurs',
};

const PLAYERS_SHORT = {
  en: 'Players',
  'fr-FR': 'Joueurs',
};

const WATCH_GAME = {
  en: 'Watch',
  'fr-FR': 'Regarder',
};

const JOIN_GAME = {
  en: 'Join',
  'fr-FR': 'Rejoindre',
};

const CONTINUE_GAME = {
  en: 'Continue',
  'fr-FR': 'Continuer',
};
