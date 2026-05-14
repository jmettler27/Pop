import { useRouter } from 'next/navigation';

import GroupIcon from '@mui/icons-material/Group';
import LoginIcon from '@mui/icons-material/Login';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, Skeleton, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { or, query, where } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { useCollectionOnce } from 'react-firebase-hooks/firestore';
import { useIntl } from 'react-intl';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { gameTypeToEmoji } from '@/backend/models/games/GameType';
import { ParticipantRole } from '@/backend/models/users/Participant';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import PlayerRepository from '@/backend/repositories/user/PlayerRepository';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/card';
import { GameOrganizersAvatarGroup, GamePlayersAvatarGroup } from '@/frontend/components/home/GameAvatars';
import { localeToEmoji } from '@/frontend/helpers/locales';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.home.OngoingGames', {
  title: 'Ongoing games',
  empty: 'No ongoing games at the moment',
  watchGame: 'Watch',
  joinGame: 'Join',
  continueGame: 'Continue',
});

export default function OngoingGames() {
  const intl = useIntl();
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
    return <></>;
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
    <Card className="bg-linear-to-br from-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-slate-700">
        <CardTitle className="text-xs sm:text-sm md:text-md lg:text-base xl:text-xl font-bold bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          🕒 {intl.formatMessage(messages.title)} ({sortedOngoingGames.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {sortedOngoingGames.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm sm:text-base">
            {intl.formatMessage(messages.empty)}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedOngoingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const GameCard = ({ game }) => {
  const intl = useIntl();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session.user;

  const organizerRepo = new OrganizerRepository(game.id);
  const playerRepo = new PlayerRepository(game.id);

  const { organizers, loading: organizersLoading, error: organizersError } = organizerRepo.useAllOrganizersOnce();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayersOnce();

  if (organizersError || playersError) {
    return <></>;
  }
  if (organizersLoading || playersLoading) {
    return <Skeleton variant="rounded" width={210} height={60} />;
  }
  if (!organizers || !players) {
    return <></>;
  }

  const organizerIds = organizers.map((o) => o.id);
  const playerIds = players.map((p) => p.id);
  const isFull = playerIds.length >= game.maxPlayers;

  const isPlayer = playerIds.some((id) => id === user.id);
  const isOrganizer = organizerIds.some((id) => id === user.id);

  let myRole;

  if (isOrganizer) {
    myRole = ParticipantRole.ORGANIZER;
  } else if (isPlayer) {
    myRole = ParticipantRole.PLAYER;
  } else {
    myRole = ParticipantRole.SPECTATOR;
  }

  const buttonText = () => {
    if (myRole === ParticipantRole.PLAYER || myRole === ParticipantRole.ORGANIZER)
      return intl.formatMessage(messages.continueGame);
    if (myRole === ParticipantRole.SPECTATOR)
      return isFull ? intl.formatMessage(messages.watchGame) : intl.formatMessage(messages.joinGame);
  };

  const ButtonIcon = () => {
    if (myRole === ParticipantRole.PLAYER || myRole === ParticipantRole.ORGANIZER) return <PlayArrowIcon />;
    if (myRole === ParticipantRole.SPECTATOR) return isFull ? <VisibilityIcon /> : <LoginIcon />;
  };

  const buttonColor = () => {
    if (myRole === ParticipantRole.PLAYER || myRole === ParticipantRole.ORGANIZER) return 'success';
    if (myRole === ParticipantRole.SPECTATOR) return isFull ? 'warning' : 'primary';
  };

  const handleJoinClick = () => {
    if (myRole === ParticipantRole.SPECTATOR && !isFull) {
      router.push(`/join/${game.id}`);
    } else {
      router.push(`/${game.id}`);
    }
  };

  return (
    <Card className="bg-slate-800/50 border border-orange-600/20 shadow-lg hover:shadow-orange-500/40 hover:border-orange-400/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Compact Header */}
      <CardHeader className="pb-3 pt-4 px-4 bg-linear-to-br from-orange-900/20 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Tooltip title={game.title} placement="top">
              <div className="flex items-center gap-2">
                <span className="text-lg shrink-0">{gameTypeToEmoji(game.type)}</span>
                <CardTitle className="text-sm sm:text-base font-semibold text-white truncate leading-tight">
                  {game.title}
                </CardTitle>
                <span className="text-base shrink-0">{localeToEmoji(game.lang)}</span>
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
                {intl.formatMessage(globalMessages.organizers)}
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
                {intl.formatMessage(globalMessages.players)}
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
