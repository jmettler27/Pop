import { GameStatus } from '@/backend/models/games/GameStatus';

import { useGameContext } from '@/frontend/contexts';

import QuestionActiveBottomPane from '@/frontend/components/game/bottom-pane/question/question-active/QuestionActiveBottomPane';
import QuestionEndBottomPane from '@/frontend/components/game/bottom-pane/question/question-end/QuestionEndBottomPane';
import TimerPane from '@/frontend/components/game/timer/TimerPane';

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

const SelectedQuestionBottomPane = ({}) => {
  const game = useGameContext();

  switch (game.status) {
    case GameStatus.QUESTION_ACTIVE:
      return <QuestionActiveBottomPane />;
    case GameStatus.QUESTION_END:
      return <QuestionEndBottomPane />;
  }
};
