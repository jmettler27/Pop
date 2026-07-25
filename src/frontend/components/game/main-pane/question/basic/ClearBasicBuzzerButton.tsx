import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { clearBuzzer } from '@/backend/services/question/basic/actions';
import { Button } from '@/frontend/components/ui/button';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';

export default function ClearBuzzerButton() {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await clearBuzzer(game!.id as string, currentRound as string, game!.currentQuestion as string);
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
