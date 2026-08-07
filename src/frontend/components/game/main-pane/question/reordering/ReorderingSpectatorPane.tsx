'use client';

import {
  ReorderingEndView,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';

interface ReorderingSpectatorPaneProps {
  baseQuestion: ReorderingQuestion;
  gameQuestion: GameReorderingQuestion;
  randomMapping: number[];
}

export default function ReorderingSpectatorPane({
  baseQuestion,
  gameQuestion,
  randomMapping,
}: ReorderingSpectatorPaneProps) {
  const game = useGame();
  if (!game) return null;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <ReorderingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {game.status === GameStatus.QUESTION_ACTIVE && (
          <ReorderingSpectatorActiveView baseQuestion={baseQuestion} randomMapping={randomMapping} />
        )}
        {game.status === GameStatus.QUESTION_END && (
          <ReorderingEndView baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
        )}
      </div>
    </div>
  );
}

function ReorderingSpectatorActiveView({
  baseQuestion,
  randomMapping,
}: {
  baseQuestion: ReorderingQuestion;
  randomMapping: number[];
}) {
  const items = baseQuestion.items ?? [];
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="rounded-2xl w-[55%] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70">
        {randomMapping.map((idx: number, displayOrder: number) => (
          <div key={idx} className="flex items-center mb-2">
            <div className="w-10 pr-2 text-right font-bold text-lg text-slate-400 dark:text-slate-500">
              {displayOrder + 1}.
            </div>
            <div className="rounded-xl flex-1 bg-slate-900 border border-gray-800 shadow-[0_6px_16px_rgba(2,6,23,0.35)] py-2.5 opacity-75">
              <h6 className="text-xl flex items-center text-slate-100">{items[idx]?.title}</h6>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
