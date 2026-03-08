import useGame from '@/frontend/hooks/useGame';

import { Button } from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import { goHome } from '@/backend/services/round/special/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';

export default function GoSpecialHomeButton() {
  const game = useGame();

  const [handleContinueClick, isHandling] = useAsyncAction(async () => {
    await goHome(game.id, game.currentRound);
  });

  return (
    <Button
      size="large"
      startIcon={<HomeIcon />}
      variant="contained"
      onClick={handleContinueClick}
      disabled={isHandling}
    >
      Retourner aux thèmes
    </Button>
  );
}
