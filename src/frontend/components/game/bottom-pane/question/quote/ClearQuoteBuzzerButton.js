import { clearBuzzer } from '@/backend/services/question/quote/actions';

import { useGameContext } from '@/frontend/contexts';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button } from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';

const messages = defineMessages('frontend.game.bottom.ClearQuoteBuzzerButton', {
  clearBuzzer: 'Clear buzzer',
});

export default function ClearBuzzerButton() {
  const intl = useIntl();
  const game = useGameContext();

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await clearBuzzer(game.id, game.currentRound, game.currentQuestion);
  });

  return (
    <Button variant="outlined" color="warning" startIcon={<ClearAllIcon />} onClick={handleClick} disabled={isClearing}>
      {intl.formatMessage(messages.clearBuzzer)}
    </Button>
  );
}
