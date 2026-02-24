import { UserRole } from '@/backend/models/users/User';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/game/GameEnumerationQuestionRepository';

import { useGameContext, useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';
import ValidateChallengerCitationButton from '@/frontend/components/game/bottom-pane/question/question-active/enumeration/controller/ValidateChallengerCitationButton';

import clsx from 'clsx';
import PropTypes from 'prop-types';

import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function ChallengerCitationHelper({}) {
  const game = useGameContext();

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id, game.currentRound);
  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion);

  if (playersError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(playersError)}
      </p>
    );
  }
  if (playersLoading) {
    return <></>;
  }
  if (!questionPlayers) {
    return <></>;
  }

  const { challenger } = questionPlayers;

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <ChallengerName challengerId={challenger.playerId} />
      <ChallengerProgress challenger={challenger} />
    </div>
  );
}

function ChallengerName({ challengerId }) {
  const { playerRepo } = useGameRepositoriesContext();
  const { player, loading: playerLoading, error: playerError } = playerRepo.usePlayer(challengerId);

  if (playerError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(playerError)}</strong>
      </p>
    );
  }
  if (playerLoading) {
    return <></>;
  }
  if (!player) {
    return <></>;
  }

  return <span className="2xl:text-3xl font-bold">{player.name}</span>;
}

const progressToSmiley = {
  0: '😐', // Neutral
  10: '🙂', // Slightly Smiling
  20: '😄', // Happy
  30: '😀', // Grinning
  40: '😁', // Beaming
  50: '😃', // Grinning with Big Eyes
  60: '😄', // Grinning with Smiling Eyes
  70: '😆', // Grinning with Squinting Eyes
  80: '🤩', // Smiling with Heart Eyes
  90: '😍', // Excited
  100: '🥳', // Super Excited
};

const progressToBarColor = {
  0: '#FF0000', // Red - 0%
  10: '#FF3300',
  20: '#FF6600',
  30: '#FF9900',
  40: '#FFCC00',
  50: '#FFFF00', // Yellow - 50%
  60: '#CCFF00',
  70: '#99FF00',
  80: '#66FF00',
  90: '#33FF00',
  100: '#00FF00', // Green - 100%
};

function ChallengerProgress({ challenger }) {
  const myRole = useRoleContext();

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

      {myRole === UserRole.ORGANIZER && <ValidateChallengerCitationButton />}
    </Box>
  );
}
