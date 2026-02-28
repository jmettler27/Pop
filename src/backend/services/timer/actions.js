'use server';

import TimerService from '@/backend/services/timer/TimerService';

export const endTimer = async (gameId) => {
  const service = new TimerService(gameId);
  return service.endTimer();
};

export const startTimer = async (gameId, duration) => {
  const service = new TimerService(gameId);
  return service.startTimer(duration);
};

export const stopTimer = async (gameId) => {
  const service = new TimerService(gameId);
  return service.stopTimer();
};

export const resetTimer = async (gameId) => {
  const service = new TimerService(gameId);
  return service.resetTimer();
};
