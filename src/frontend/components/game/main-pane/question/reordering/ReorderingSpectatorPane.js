'use client';

import { useState } from 'react';

import { List, ListItemButton, Typography } from '@mui/material';

import { GameStatus } from '@/backend/models/games/GameStatus';
import useGame from '@/frontend/hooks/useGame';

import { ReorderingItemAccordion, ReorderingQuestionHeader } from './ReorderingCommon';

export default function ReorderingSpectatorPane({ baseQuestion, randomMapping }) {
  const game = useGame();

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

function ReorderingSpectatorActiveView({ baseQuestion, randomMapping }) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <List className="rounded-2xl w-[55%] overflow-y-auto mb-3 bg-slate-900/70 p-2 shadow-lg ring-1 ring-slate-700/70">
        {randomMapping.map((idx, displayOrder) => (
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
                {baseQuestion.items[idx].title}
              </Typography>
            </ListItemButton>
          </div>
        ))}
      </List>
    </div>
  );
}

function ReorderingSpectatorEndView({ baseQuestion }) {
  const [expandedIdx, setExpandedIdx] = useState(false);
  const displayOrder = baseQuestion.items.map((_, i) => i);

  const handleAccordionChange = (idx) => {
    setExpandedIdx(expandedIdx === idx ? false : idx);
  };

  return (
    <div className="flex flex-col items-center w-1/2 max-h-[90%]">
      <List className="rounded-lg w-full overflow-y-auto mb-3 bg-white dark:bg-slate-900">
        {displayOrder.map((idx, position) => (
          <ReorderingItemAccordion
            key={idx}
            item={baseQuestion.items[idx]}
            displayOrder={position}
            expanded={expandedIdx === idx}
            onAccordionChange={() => handleAccordionChange(idx)}
          />
        ))}
      </List>
    </div>
  );
}
