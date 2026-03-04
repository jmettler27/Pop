'use client';

import { useState } from 'react';
import { List } from '@mui/material';

import { ReorderingQuestionHeader, ReorderingItemAccordion } from './ReorderingCommon';

export default function ReorderingOrganizerPane({ baseQuestion }) {
  const [expandedIdx, setExpandedIdx] = useState(false);
  const displayOrder = baseQuestion.items.map((_, i) => i);

  const handleAccordionChange = (idx) => {
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
      </div>
    </div>
  );
}
