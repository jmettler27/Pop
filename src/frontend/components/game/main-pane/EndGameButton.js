import { useParams } from 'next/navigation';

import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { endGame } from '@/backend/services/game/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.EndGameButton', {
  endGame: 'End Game',
});

export default function EndGameButton() {
  const intl = useIntl();
  const { id: gameId } = useParams();

  const [handleEndGame, isEnding] = useAsyncAction(async () => {
    await endGame(gameId);
  });

  return (
    <Button
      // startIcon={}
      variant="contained"
      onClick={handleEndGame}
      disabled={isEnding}
      color="warning"
    >
      {intl.formatMessage(messages.endGame)}
    </Button>
  );
}
