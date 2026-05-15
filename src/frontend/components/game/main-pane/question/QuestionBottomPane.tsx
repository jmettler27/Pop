'use client';

import QuestionActiveBottomPane from '@/frontend/components/game/main-pane/question/QuestionActiveBottomPane';
import QuestionEndBottomPane from '@/frontend/components/game/main-pane/question/QuestionEndBottomPane';
import TimerPane from '@/frontend/components/game/timer/TimerPane';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';

export default function QuestionBottomPane() {
  return (
    <div className="flex flex-row h-full items-center justify-center divide-x divide-solid">
      <div className="flex flex-col h-full w-1/5 items-center justify-center">
        <TimerPane />
      </div>

      <div className="flex flex-col h-full w-4/5">
        <SelectedQuestionBottomPane />
      </div>
    </div>
  );
}

function SelectedQuestionBottomPane() {
  const game = useGame();
  if (!game) return null;

  switch (game.status) {
    case GameStatus.QUESTION_ACTIVE:
      return <QuestionActiveBottomPane />;
    case GameStatus.QUESTION_END:
      return <QuestionEndBottomPane />;
    default:
      return null;
  }
}
