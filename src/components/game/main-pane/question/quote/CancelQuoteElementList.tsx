'use client';

import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { QuoteQuestion } from '@/models/questions/quote';

export default function CancelQuoteElementList({ toGuess }: { toGuess: string[] }) {
  const [checked, setChecked] = React.useState<string[]>([]);

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <ul className="w-full max-w-[360px] bg-background">
      {toGuess.map((quoteElem: string) => {
        const labelId = `checkbox-list-label-${quoteElem}`;

        return (
          <li key={quoteElem}>
            <button
              type="button"
              onClick={handleToggle(quoteElem)}
              className="w-full flex items-center gap-1 py-1 text-left hover:bg-muted rounded-md"
            >
              <span className="flex items-center justify-center">
                <Checkbox checked={checked.indexOf(quoteElem) !== -1} tabIndex={-1} aria-labelledby={labelId} />
              </span>
              <span id={labelId}>{QuoteQuestion.prependElementWithEmoji(quoteElem)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
