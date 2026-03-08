import { clearBuzzer } from '@/backend/services/question/quote/actions';
import globalMessages from '@/i18n/globalMessages';

import useGame from '@/frontend/hooks/useGame';

import { useIntl } from 'react-intl';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';

import { Button } from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';

export default function ClearBuzzerButton() {
  const intl = useIntl();
  const game = useGame();

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await clearBuzzer(game.id, game.currentRound, game.currentQuestion);
  });

  return (
    <Button variant="outlined" color="warning" startIcon={<ClearAllIcon />} onClick={handleClick} disabled={isClearing}>
      {intl.formatMessage(globalMessages.clearBuzzer)}
    </Button>
  );
}
