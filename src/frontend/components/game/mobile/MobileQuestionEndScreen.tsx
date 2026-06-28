'use client';

import { useIntl } from 'react-intl';

import QuestionEndBottomPane from '@/frontend/components/game/main-pane/question/QuestionEndBottomPane';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.mobile.MobileQuestionEndScreen', {
  waitingMessage: 'Waiting for the next question...',
});

export default function MobileQuestionEndScreen() {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;

  const { timerRepo } = gameRepositories;
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError || timerLoading || !timer) return null;

  if (!timer.authorized) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <span className="text-center text-xl text-slate-400">{intl.formatMessage(messages.waitingMessage)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <QuestionEndBottomPane />
    </div>
  );
}
