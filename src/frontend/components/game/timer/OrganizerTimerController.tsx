import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { ButtonGroup, IconButton, Tooltip } from '@mui/material';

import { resetTimer, startTimer, stopTimer } from '@/backend/services/timer/actions';
import Timer, { type TimerData } from '@/frontend/components/game/timer/Timer';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import { TimerStatus } from '@/models/timer';

interface OrganizerTimerControllerProps {
  timer: TimerData;
  serverTimeOffset: number;
  onTimerEnd: () => void;
}

interface TimerButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export default function OrganizerTimerController({
  timer,
  serverTimeOffset,
  onTimerEnd,
}: OrganizerTimerControllerProps) {
  const game = useGame();

  const [handleTimerEnd, isEnding] = useAsyncAction(async () => {
    await onTimerEnd();
    // await endTimer(gameId)
  });

  const [handleStartTimer, isStarting] = useAsyncAction(async () => {
    await startTimer(game!.id as string);
  });

  const [handleStopTimer, isStopping] = useAsyncAction(async () => {
    await stopTimer(game!.id as string);
  });

  const [handleResetTimer, isResetting] = useAsyncAction(async () => {
    await resetTimer(game!.id as string);
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
        <ResetTimerButton onClick={handleResetTimer} disabled={isResetting} />
        <EndTimerButton onClick={handleTimerEnd} disabled={isEnding} />
      </ButtonGroup>
    </div>
  );
}

function StartTimerButton({ onClick, disabled }: TimerButtonProps) {
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

function StopTimerButton({ onClick, disabled }: TimerButtonProps) {
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

function ResetTimerButton({ onClick, disabled }: TimerButtonProps) {
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

function EndTimerButton({ onClick, disabled }: TimerButtonProps) {
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
