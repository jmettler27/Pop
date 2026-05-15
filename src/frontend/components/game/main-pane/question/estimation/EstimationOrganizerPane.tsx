'use client';

import { useIntl } from 'react-intl';

import {
  EstimationEndView,
  EstimationQuestionHeader,
  formatAnswerValue,
  messages,
} from '@/frontend/components/game/main-pane/question/estimation/EstimationCommon';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';

interface EstimationOrganizerPaneProps {
  baseQuestion: EstimationQuestion;
  gameQuestion: GameEstimationQuestion;
}

export default function EstimationOrganizerPane({ baseQuestion, gameQuestion }: EstimationOrganizerPaneProps) {
  const intl = useIntl();
  const game = useGame();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <EstimationQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {game!.status !== GameStatus.QUESTION_END && (
          <div className="flex flex-row items-center gap-3 px-5 py-2.5 rounded-2xl border border-green-500/40 bg-green-500/10">
            <span className="text-sm uppercase tracking-widest text-slate-400 font-semibold">
              {intl.formatMessage(messages.correctAnswer)}
            </span>
            <span className="text-5xl 2xl:text-6xl font-bold text-green-400 tabular-nums">
              {formatAnswerValue(baseQuestion.answerType, baseQuestion.answer, intl.locale)}
            </span>
          </div>
        )}
        {game!.status === GameStatus.QUESTION_END && (
          <EstimationEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}
