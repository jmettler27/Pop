'use client';

import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { clearBuzzer } from '@/backend/services/question/quote/actions';
import { Button } from '@/frontend/components/ui/button';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';

export default function ClearBuzzerButton() {
  const intl = useIntl();
  const game = useGame();

  const [handleClick, isClearing] = useAsyncAction(async () => {
    if (!game) return;
    await clearBuzzer(game.id as string, game.currentRound as string, game.currentQuestion as string);
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
