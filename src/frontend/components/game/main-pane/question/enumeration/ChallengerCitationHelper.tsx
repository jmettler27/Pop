import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import ValidateChallengerCitationButton from '@/frontend/components/game/main-pane/question/enumeration/ValidateChallengerCitationButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import { GameRounds } from '@/models/games/game';
import { ParticipantRole } from '@/models/users/participant';

interface Challenger {
  playerId: string;
  numCorrect: number;
  bet: number;
  cited: Record<string, unknown>;
}

export default function ChallengerCitationHelper() {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id as string, game.currentRound as string);
  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion as string);

  if (playersError || playersLoading || !questionPlayers) {
    return <></>;
  }

  const { challenger } = questionPlayers as { challenger: Challenger };

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <ChallengerName challengerId={challenger.playerId} />
      <ChallengerProgress challenger={challenger} />
    </div>
  );
}

function ChallengerName({ challengerId }: { challengerId: string }) {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo } = gameRepositories;
  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayer(challengerId);

  if (playerError || playerLoading || !player) {
    return <></>;
  }

  return <span className="2xl:text-3xl font-bold">{player.name}</span>;
}

const progressToSmiley: Record<number, string> = {
  0: '😐',
  10: '🙂',
  20: '😄',
  30: '😀',
  40: '😁',
  50: '😃',
  60: '😄',
  70: '😆',
  80: '🤩',
  90: '😍',
  100: '🥳',
};

const progressToBarColor: Record<number, string> = {
  0: '#FF0000',
  10: '#FF3300',
  20: '#FF6600',
  30: '#FF9900',
  40: '#FFCC00',
  50: '#FFFF00',
  60: '#CCFF00',
  70: '#99FF00',
  80: '#66FF00',
  90: '#33FF00',
  100: '#00FF00',
};

function ChallengerProgress({ challenger }: { challenger: Challenger }) {
  const myRole = useRole();

  const percentage = (challenger.numCorrect * 100) / challenger.bet;
  const cappedPercentage = Math.min(percentage, 100);
  const roundedDownToNearestTen = Math.floor(cappedPercentage / 10) * 10;

  return (
    <Box className="flex flex-row w-full items-center justify-center space-x-4">
      <Typography variant="h5">{progressToSmiley[roundedDownToNearestTen]}</Typography>

      <LinearProgress
        className="w-1/2 h-3"
        sx={{
          '& .MuiLinearProgress-bar': {
            backgroundColor: progressToBarColor[roundedDownToNearestTen],
          },
        }}
        variant="determinate"
        value={cappedPercentage}
      />

      <Typography variant="h5" className={clsx(challenger.numCorrect >= challenger.bet && 'text-green-500')}>
        {challenger.numCorrect}/<strong>{challenger.bet}</strong>
      </Typography>

      {myRole === ParticipantRole.ORGANIZER && <ValidateChallengerCitationButton />}
    </Box>
  );
}
