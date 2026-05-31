'use client';

import { useState } from 'react';

import { List } from '@mui/material';

import {
  ReorderingEndView,
  ReorderingItemAccordion,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';

interface ReorderingOrganizerPaneProps {
  baseQuestion: ReorderingQuestion;
  gameQuestion: GameReorderingQuestion;
}

export default function ReorderingOrganizerPane({ baseQuestion, gameQuestion }: ReorderingOrganizerPaneProps) {
  const game = useGame();
  const [expandedIdx, setExpandedIdx] = useState<number | false>(false);
  const displayOrder = (baseQuestion.items ?? []).map((_: unknown, i: number) => i);

  if (!game) return null;

  const handleAccordionChange = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? false : idx);
  };

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <ReorderingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {game.status !== GameStatus.QUESTION_END && (
          <div className="flex flex-col items-center w-1/2 max-h-[90%]">
            <List className="rounded-lg w-full overflow-y-auto mb-3 bg-white dark:bg-slate-900">
              {displayOrder.map((idx: number, position: number) => (
                <ReorderingItemAccordion
                  key={idx}
                  item={(baseQuestion.items ?? [])[idx]!}
                  displayOrder={position}
                  expanded={expandedIdx === idx}
                  onAccordionChange={() => handleAccordionChange(idx)}
                  teamPlacedAt={undefined}
                  isCorrect={undefined}
                />
              ))}
            </List>
          </div>
        )}
        {game.status === GameStatus.QUESTION_END && (
          <ReorderingEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}
