'use client';

import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { QUESTION_ACTIONS, questionAction } from '@/api';
import { Button } from '@/components/ui/button';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import globalMessages from '@/i18n/globalMessages';

export default function ClearBuzzerButton() {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: QUESTION_ACTIONS.BuzzerClear });
  });

  return (
    <Button
      variant="outline"
      className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
      onClick={handleClick}
      disabled={isClearing}
    >
      <RotateCcw className="mr-2 size-4" />
      {intl.formatMessage(globalMessages.clearBuzzer)}
    </Button>
  );
}
