'use client';

import { useState } from 'react';

import { List, ListItemButton, Typography } from '@mui/material';

import {
  ReorderingItemAccordion,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { ReorderingQuestion } from '@/models/questions/reordering';

interface ReorderingSpectatorPaneProps {
  baseQuestion: ReorderingQuestion;
  randomMapping: number[];
}

export default function ReorderingSpectatorPane({ baseQuestion, randomMapping }: ReorderingSpectatorPaneProps) {
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
        {game.status === GameStatus.QUESTION_END && <ReorderingSpectatorEndView baseQuestion={baseQuestion} />}
      </div>
    </div>
  );
}

function ReorderingSpectatorActiveView({ baseQuestion, randomMapping }: ReorderingSpectatorPaneProps) {
  const items = baseQuestion.items ?? [];
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <List className="rounded-2xl w-[55%] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70">
        {randomMapping.map((idx: number, displayOrder: number) => (
          <div key={idx} className="flex items-center mb-2">
            <div className="w-10 pr-2 text-right font-bold text-lg text-slate-400 dark:text-slate-500">
              {displayOrder + 1}.
            </div>
            <ListItemButton
              divider={false}
              disabled
              className="rounded-xl flex-1"
              sx={{
                bgcolor: '#0f172a',
                borderRadius: 3,
                border: '1px solid',
                borderColor: '#1f2937',
                boxShadow: '0 6px 16px rgba(2, 6, 23, 0.35)',
                py: 1.25,
                '&.Mui-disabled': {
                  opacity: 0.75,
                },
              }}
            >
              <Typography variant="h6" className="flex items-center text-slate-100">
                {items[idx]?.title}
              </Typography>
            </ListItemButton>
          </div>
        ))}
      </List>
    </div>
  );
}

function ReorderingSpectatorEndView({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const [expandedIdx, setExpandedIdx] = useState<number | false>(false);
  const items = baseQuestion.items ?? [];
  const displayOrder = items.map((_: unknown, i: number) => i);

  const handleAccordionChange = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? false : idx);
  };

  return (
    <div className="flex flex-col items-center w-1/2 max-h-[90%]">
      <List className="rounded-lg w-full overflow-y-auto mb-3 bg-white dark:bg-slate-900">
        {displayOrder.map((idx: number, position: number) => (
          <ReorderingItemAccordion
            key={idx}
            item={items[idx]}
            displayOrder={position}
            expanded={expandedIdx === idx}
            onAccordionChange={() => handleAccordionChange(idx)}
            teamPlacedAt={undefined}
            isCorrect={undefined}
          />
        ))}
      </List>
    </div>
  );
}
