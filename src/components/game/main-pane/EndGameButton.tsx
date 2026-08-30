import { useIntl } from 'react-intl';

import { updateGame } from '@/api';
import { Button } from '@/components/ui/button';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import defineMessages from '@/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.EndGameButton', {
  endGame: 'End Game',
});

export default function EndGameButton() {
  const intl = useIntl();
  const gameId = useGameId();

  const [handleEndGame, isEnding] = useAsyncAction(async () => {
    await updateGame(gameId as string, { action: 'end' });
  });

  return (
    <Button onClick={handleEndGame} disabled={isEnding} className="bg-amber-500 text-white hover:bg-amber-500/80">
      {intl.formatMessage(messages.endGame)}
    </Button>
  );
}
