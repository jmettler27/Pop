'use client';

import { useState } from 'react';

import { List } from '@mui/material';

import {
  ReorderingItemAccordion,
  ReorderingQuestionHeader,
} from '@/frontend/components/game/main-pane/question/reordering/ReorderingCommon';
import { ReorderingQuestion } from '@/models/questions/reordering';

export default function ReorderingOrganizerPane({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const [expandedIdx, setExpandedIdx] = useState<number | false>(false);
  const displayOrder = (baseQuestion.items ?? []).map((_: unknown, i: number) => i);

  const handleAccordionChange = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? false : idx);
  };

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <ReorderingQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center w-1/2 max-h-[90%]">
          <List className="rounded-lg w-full overflow-y-auto mb-3 bg-white dark:bg-slate-900">
            {displayOrder.map((idx: number, position: number) => (
              <ReorderingItemAccordion
                key={idx}
                item={(baseQuestion.items ?? [])[idx]}
                displayOrder={position}
                expanded={expandedIdx === idx}
                onAccordionChange={() => handleAccordionChange(idx)}
                teamPlacedAt={undefined}
                isCorrect={undefined}
              />
            ))}
          </List>
        </div>
      </div>
    </div>
  );
}
