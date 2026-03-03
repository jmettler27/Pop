import { useParams } from 'next/navigation';

import { endGame } from '@/backend/services/game/actions';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button } from '@mui/material';

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
