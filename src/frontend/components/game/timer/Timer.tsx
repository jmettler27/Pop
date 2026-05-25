import { useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { TimerStatus } from '@/models/timer';

const INTERVAL_MS = 50;
const CRITICAL_MS = 5000;

function toMs(timestamp: { toMillis: () => number } | number): number {
  return typeof timestamp === 'number' ? timestamp : timestamp.toMillis();
}

export interface TimerData {
  status: string;
  duration: number;
  timestamp: { toMillis: () => number } | number;
  forward?: boolean;
  authorized?: boolean;
}

interface TimerProps {
  timer: TimerData;
  serverTimeOffset: number;
  onTimerEnd?: () => void;
}

export default function Timer({ timer, serverTimeOffset, onTimerEnd = () => {} }: TimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endFiredRef = useRef(false);
  const onTimerEndRef = useRef(onTimerEnd);

  // Keep callback ref up to date without retriggering effects
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  // Compute the display value (remaining milliseconds for countdown, elapsed for forward)
  const computeDisplayMs = useCallback(() => {
    if (timer.status === TimerStatus.RESET || timer.status === TimerStatus.STOP) {
      // For RESET and STOP, duration holds the remaining seconds
      if (timer.forward) {
        return 0; // forward timers show 0 when not running
      }
      return timer.duration * 1000;
    }

    if (timer.status === TimerStatus.END) {
      return timer.forward ? timer.duration * 1000 : 0;
    }

    if (timer.status === TimerStatus.START && timer.timestamp) {
      const startMs = toMs(timer.timestamp);
      const elapsedMs = Date.now() - startMs + serverTimeOffset;

      if (timer.forward) {
        return Math.min(elapsedMs, timer.duration * 1000);
      }
      return Math.max(timer.duration * 1000 - elapsedMs, 0);
    }

    return timer.forward ? 0 : timer.duration * 1000;
  }, [timer.status, timer.duration, timer.timestamp, timer.forward, serverTimeOffset]);

  const [displayMs, setDisplayMs] = useState(computeDisplayMs);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // React to timer state changes from the server
  useEffect(() => {
    clearTimer();
    endFiredRef.current = false;

    if (timer.status === TimerStatus.RESET || timer.status === TimerStatus.STOP) {
      setDisplayMs(computeDisplayMs());
      return;
    }

    if (timer.status === TimerStatus.END) {
      setDisplayMs(timer.forward ? timer.duration * 1000 : 0);
      return;
    }

    if (timer.status === TimerStatus.START && timer.timestamp) {
      // Set initial display value immediately
      setDisplayMs(computeDisplayMs());

      intervalRef.current = setInterval(() => {
        const startMs = toMs(timer.timestamp);
        const elapsedMs = Date.now() - startMs + serverTimeOffset;

        let currentMs;
        if (timer.forward) {
          currentMs = Math.min(elapsedMs, timer.duration * 1000);
        } else {
          currentMs = Math.max(timer.duration * 1000 - elapsedMs, 0);
        }

        setDisplayMs(currentMs);

        // Check if timer has naturally ended
        const hasEnded = timer.forward ? currentMs >= timer.duration * 1000 : currentMs <= 0;

        if (hasEnded && !endFiredRef.current) {
          endFiredRef.current = true;
          clearTimer();
          // Defer the callback to avoid setState-during-render
          setTimeout(() => onTimerEndRef.current(), 0);
        }
      }, INTERVAL_MS);
    }

    return clearTimer;
  }, [timer.status, timer.duration, timer.timestamp, timer.forward, serverTimeOffset, clearTimer, computeDisplayMs]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const endMillisecond = timer.forward ? timer.duration * 1000 : 0;
  const isCritical = Math.abs(displayMs - endMillisecond) <= CRITICAL_MS;

  return (
    <span
      className={clsx(
        isCritical && 'text-red-500',
        timer.status === TimerStatus.RESET && 'opacity-50 text-yellow-500',
        timer.status === TimerStatus.STOP && 'opacity-50'
      )}
    >
      {displayMs <= 0 && !timer.forward ? '0' : Math.ceil(displayMs / 1000)}
    </span>
  );
}
