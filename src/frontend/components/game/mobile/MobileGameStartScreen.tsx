'use client';

import { useIntl } from 'react-intl';

import ReadyPlayerController from '@/frontend/components/game/main-pane/ReadyPlayerController';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.mobile.MobileGameStartScreen', {
  welcome: 'Welcome! 🎉',
  waitingMessage: 'The game is about to start...',
});

export default function MobileGameStartScreen() {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;

  const { timerRepo } = gameRepositories;
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError || timerLoading || !timer) return null;

  if (!timer.authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <span className="text-3xl font-bold text-white">{intl.formatMessage(messages.welcome)}</span>
        <span className="text-lg text-slate-400">{intl.formatMessage(messages.waitingMessage)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <ReadyPlayerController />
    </div>
  );
}
