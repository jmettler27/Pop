import { resetTimer, startTimer, stopTimer, endTimer } from '@/backend/repositories/timer/timer';

import { TimerStatus } from '@/backend/models/Timer';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext } from '@/frontend/contexts';

import Timer from '@/frontend/components/game/timer/Timer';

import { Button, ButtonGroup, Tooltip, IconButton } from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';

export default function OrganizerTimerController({ timer, serverTimeOffset, onTimerEnd }) {
  const game = useGameContext();

  const [handleTimerEnd, isEnding] = useAsyncAction(async () => {
    await onTimerEnd();
    // await endTimer(gameId)
  });

  const [handleStartTimer, isStarting] = useAsyncAction(async () => {
    await startTimer(game.id);
  });

  const [handleStopTimer, isStopping] = useAsyncAction(async () => {
    await stopTimer(game.id);
  });

  const [handleResetTimer, isResetting] = useAsyncAction(async () => {
    await resetTimer(game.id);
  });

  return (
    <div className="flex flex-col items-center">
      <span className="2xl:text-4xl">
        ⌛ <Timer timer={timer} serverTimeOffset={serverTimeOffset} onTimerEnd={onTimerEnd} />
      </span>

      <ButtonGroup variant="contained">
        {timer.status === TimerStatus.RESET || timer.status === TimerStatus.STOP || timer.status === TimerStatus.END ? (
          <StartTimerButton onClick={handleStartTimer} disabled={isStarting} />
        ) : (
          <StopTimerButton onClick={handleStopTimer} disabled={isStopping} />
        )}
        <ResetTimerButton onClick={handleResetTimer} disabled={timer.status === TimerStatus.RESET || isResetting} />
        <EndTimerButton onClick={handleTimerEnd} disabled={isEnding} />
      </ButtonGroup>
    </div>
  );
}

function StartTimerButton({ onClick, disabled }) {
  return (
    <Tooltip title="Start timer" placement="top">
      <span>
        <IconButton size="large" color="inherit" onClick={onClick} disabled={disabled}>
          <PlayArrowIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function StopTimerButton({ onClick, disabled }) {
  return (
    <Tooltip title="Stop timer" placement="top">
      <span>
        <IconButton size="large" color="inherit" onClick={onClick} disabled={disabled}>
          <PauseIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function ResetTimerButton({ onClick, disabled }) {
  return (
    <Tooltip title="Reset timer" placement="top">
      <span>
        <IconButton size="large" color="warning" onClick={onClick} disabled={disabled}>
          <RestartAltIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

function EndTimerButton({ onClick, disabled }) {
  return (
    <Tooltip title="End timer" placement="top">
      <span>
        <IconButton size="large" color="warning" onClick={onClick} disabled={disabled}>
          <SkipNextIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
