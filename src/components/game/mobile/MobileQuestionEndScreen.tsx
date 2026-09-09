'use client';

import { useIntl } from 'react-intl';

import QuestionEndBottomPane from '@/components/game/main-pane/question/QuestionEndBottomPane';
import { ActiveQuestionProvider } from '@/contexts/ActiveQuestionContext';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import useGame from '@/hooks/useGame';
import defineMessages from '@/i18n/defineMessages';
import { type QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.mobile.MobileQuestionEndScreen', {
  waitingMessage: 'Waiting for the next question...',
});

export default function MobileQuestionEndScreen() {
  const intl = useIntl();
  const game = useGame();
  const { timer, timerLoading, timerError } = useTimer(game?.id ?? null);
  if (!game) return null;

  if (timerError || timerLoading || !timer) return null;

  if (!timer.authorized) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <span className="text-center text-xl text-slate-400">{intl.formatMessage(messages.waitingMessage)}</span>
      </div>
    );
  }

  return (
    <ActiveQuestionProvider
      gameId={game.id as string}
      roundId={game.currentRound as string}
      questionId={game.currentQuestion as string}
      questionType={game.currentQuestionType as QuestionType}
    >
      <div className="flex flex-col items-center justify-center h-full p-6">
        <QuestionEndBottomPane />
      </div>
    </ActiveQuestionProvider>
  );
}
