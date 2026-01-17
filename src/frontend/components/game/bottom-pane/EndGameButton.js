import { useParams } from 'next/navigation';

import { endGame } from '@/backend/services/game/actions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { Button } from '@mui/material';

export default function EndGameButton({ lang = DEFAULT_LOCALE }) {
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
      {END_GAME[lang]}
    </Button>
  );
}

const END_GAME = {
  en: 'End Game',
  'fr-FR': 'Terminer la partie',
};
