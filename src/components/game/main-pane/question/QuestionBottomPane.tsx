'use client';

import QuestionActiveBottomPane from '@/components/game/main-pane/question/QuestionActiveBottomPane';
import QuestionEndBottomPane from '@/components/game/main-pane/question/QuestionEndBottomPane';
import TimerPane from '@/components/game/timer/TimerPane';
import { ActiveQuestionProvider } from '@/contexts/ActiveQuestionContext';
import useGame from '@/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { type QuestionType } from '@/models/questions/question-type';

export default function QuestionBottomPane() {
  const game = useGame();
  if (!game) return null;

  return (
    <ActiveQuestionProvider
      gameId={game.id as string}
      roundId={game.currentRound as string}
      questionId={game.currentQuestion as string}
      questionType={game.currentQuestionType as QuestionType}
    >
      <div className="flex flex-row h-full items-center justify-center divide-x divide-solid">
        <div className="flex flex-col h-full w-1/5 items-center justify-center">
          <TimerPane />
        </div>

        <div className="flex flex-col h-full w-4/5">
          <SelectedQuestionBottomPane />
        </div>
      </div>
    </ActiveQuestionProvider>
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
