import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';

import { updateTimer } from '@/api';
import Timer, { type TimerData } from '@/components/game/timer/Timer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
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
  const gameId = useGameId();

  const [handleTimerEnd, isEnding] = useAsyncAction(async () => {
    await onTimerEnd();
    // await endTimer(gameId)
  });

  const [handleStartTimer, isStarting] = useAsyncAction(async () => {
    await updateTimer(gameId, { action: 'start', duration: timer.duration });
  });

  const [handleStopTimer, isStopping] = useAsyncAction(async () => {
    await updateTimer(gameId, { action: 'stop' });
  });

  const [handleResetTimer, isResetting] = useAsyncAction(async () => {
    await updateTimer(gameId, { action: 'reset' });
  });

  return (
    <div className="flex flex-col items-center">
      <span className="2xl:text-4xl">
        ⌛ <Timer timer={timer} serverTimeOffset={serverTimeOffset} onTimerEnd={onTimerEnd} />
      </span>

      <div className="flex gap-1">
        {timer.status === TimerStatus.RESET || timer.status === TimerStatus.STOP || timer.status === TimerStatus.END ? (
          <StartTimerButton onClick={handleStartTimer} disabled={isStarting} />
        ) : (
          <StopTimerButton onClick={handleStopTimer} disabled={isStopping} />
        )}
        <ResetTimerButton onClick={handleResetTimer} disabled={isResetting} />
        <EndTimerButton onClick={handleTimerEnd} disabled={isEnding} />
      </div>
    </div>
  );
}

function StartTimerButton({ onClick, disabled }: TimerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button variant="ghost" size="icon-lg" onClick={onClick} disabled={disabled}>
          <Play />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Start timer</TooltipContent>
    </Tooltip>
  );
}

function StopTimerButton({ onClick, disabled }: TimerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button variant="ghost" size="icon-lg" onClick={onClick} disabled={disabled}>
          <Pause />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Stop timer</TooltipContent>
    </Tooltip>
  );
}

function ResetTimerButton({ onClick, disabled }: TimerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-amber-500 hover:bg-amber-500/10"
          onClick={onClick}
          disabled={disabled}
        >
          <RotateCcw />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Reset timer</TooltipContent>
    </Tooltip>
  );
}

function EndTimerButton({ onClick, disabled }: TimerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-amber-500 hover:bg-amber-500/10"
          onClick={onClick}
          disabled={disabled}
        >
          <SkipForward />
        </Button>
      </TooltipTrigger>
      <TooltipContent>End timer</TooltipContent>
    </Tooltip>
  );
}
